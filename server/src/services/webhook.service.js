const Tour = require("../models/Tour");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Policy = require("../models/Policy");
const ledgerService = require("./ledger.service");
const { verifyWithRetry } = require("../utils/webhookSignature");

const FAIL_REASONS = {
  failed: "Your card was declined by the issuing bank. Nothing was charged.",
  held: "Score above the review threshold — a human checks this within the hour.",
  late: "Your payment arrived after the hold expired. Refunded automatically — the seat had already gone.",
  "sold-out": "Someone completed payment for the last seat moments before you. Refunded automatically.",
};

// The single atomic conditional update, CLAUDE.md §3's exact shape —
// findOneAndUpdate with a $gte filter, never read-then-write. A null result
// means someone else took the seat first; treated as sold-out/late-webhook,
// never oversold.
async function deductSeat(tourId, departureId, seats) {
  return Tour.findOneAndUpdate(
    { _id: tourId },
    { $inc: { "departures.$[dep].seatsLeft": -seats } },
    { arrayFilters: [{ "dep._id": departureId, "dep.seatsLeft": { $gte: seats } }], returnDocument: 'after' }
  );
}

async function restoreSeat(tourId, departureId, seats) {
  return Tour.findOneAndUpdate(
    { _id: tourId },
    { $inc: { "departures.$[dep].seatsLeft": seats } },
    { arrayFilters: [{ "dep._id": departureId }], returnDocument: 'after' }
  );
}

// The sole authority on a payment outcome (CLAUDE.md §3: "the webhook is the
// sole authority — nothing captures on the client's word"). Called both by
// the real Express route (`controllers/booking/webhook.controller.js`) and,
// in-process, by the mock gateway's simulated async delivery — one
// implementation either way.
async function processPaymentWebhook(payload, signature) {
  const { paymentId, status, fraudScore = 0, fraudFactors = [] } = payload;

  let verified = false;
  try {
    verified = await verifyWithRetry(payload, signature);
  } catch {
    verified = false;
  }

  const payment = await Payment.findOne({ paymentId });
  if (!payment) return { ok: false, reason: "unknown_payment" };
  if (payment.status !== "pending") return { ok: true, idempotent: true }; // already resolved — ignore a duplicate/retry delivery

  if (!verified) {
    payment.status = "failed";
    payment.failureReason = "Webhook signature could not be verified after 3 attempts.";
    await payment.save();
    await Booking.updateOne(
      { _id: payment.booking },
      { paymentState: "failed", status: "failed", outcomeReason: payment.failureReason }
    );
    return { ok: false, reason: "signature_invalid" };
  }

  const booking = await Booking.findById(payment.booking);
  if (!booking) return { ok: false, reason: "unknown_booking" };

  // The Lock doc is already gone by now (released at checkout, CLAUDE.md §3
  // "startLock reserves... without deducting" — its job ends once submitted)
  // — `lockExpiresAt` is the snapshot taken at that moment, so a late arrival
  // is detected without needing the Lock to still exist.
  const isLate = status === "confirmed" && booking.lockExpiresAt && booking.lockExpiresAt.getTime() <= Date.now();

  payment.fraudScore = fraudScore;
  payment.fraudFactors = fraudFactors;
  payment.webhookVerifiedAt = new Date();

  if (status === "held") {
    payment.status = "held";
    booking.paymentState = "held";
    booking.status = "held";
    booking.outcomeReason = FAIL_REASONS.held;
  } else if (status === "failed") {
    payment.status = "failed";
    payment.failureReason = FAIL_REASONS.failed;
    booking.paymentState = "failed";
    booking.status = "failed";
    booking.outcomeReason = FAIL_REASONS.failed;
  } else if (isLate) {
    payment.status = "failed";
    payment.failureReason = FAIL_REASONS.late;
    booking.paymentState = "failed";
    booking.status = "failed";
    booking.outcomeReason = FAIL_REASONS.late;
  } else if (status === "confirmed") {
    const updatedTour = await deductSeat(booking.tour, booking.departureId, booking.seats);
    if (!updatedTour) {
      payment.status = "failed";
      payment.failureReason = FAIL_REASONS["sold-out"];
      booking.paymentState = "failed";
      booking.status = "failed";
      booking.outcomeReason = FAIL_REASONS["sold-out"];
    } else {
      payment.status = "confirmed";
      booking.paymentState = "confirmed";
      booking.status = "confirmed";

      const policy = await Policy.getSingleton();
      const tourDoc = updatedTour;
      await ledgerService.accrueCommission({
        ref: booking.ref,
        party: tourDoc.operator,
        label: `Commission on ${booking.ref}`,
        gross: booking.amounts.total,
        rate: policy.commissionPct / 100,
        via: booking.method,
      });
    }
  }

  await payment.save();
  await booking.save();

  return { ok: true, paymentStatus: payment.status };
}

module.exports = { processPaymentWebhook, deductSeat, restoreSeat, FAIL_REASONS };
