const Tour = require("../models/Tour");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Policy = require("../models/Policy");
const ledgerService = require("./ledger.service");
const subscriptionService = require("./subscription.service");
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
//
// The $gte guard has to live in the TOP-LEVEL query (via $elemMatch), not
// just in `arrayFilters`. `arrayFilters` only decides which array elements
// an update touches — it is not itself a match condition on the document.
// A departure whose seatsLeft is already below `seats` still matches
// `{ _id: tourId }` on its own, so `arrayFilters: [{ seatsLeft: { $gte:
// seats } }]` alone leaves $inc with nothing to touch but still returns the
// (unchanged) document instead of null — silently defeating the whole
// anti-oversell guarantee. Caught while building the group-split path,
// which is the first caller that actually forces the race in a test.
async function deductSeat(tourId, departureId, seats) {
  return Tour.findOneAndUpdate(
    { _id: tourId, departures: { $elemMatch: { _id: departureId, seatsLeft: { $gte: seats } } } },
    { $inc: { "departures.$[dep].seatsLeft": -seats } },
    { arrayFilters: [{ "dep._id": departureId }], returnDocument: "after" }
  );
}

async function restoreSeat(tourId, departureId, seats) {
  return Tour.findOneAndUpdate(
    { _id: tourId },
    { $inc: { "departures.$[dep].seatsLeft": seats } },
    { arrayFilters: [{ "dep._id": departureId }], returnDocument: 'after' }
  );
}

// The one real-capture code path — the atomic seat deduction plus
// plan-driven commission accrual — shared by the webhook's own `confirmed`
// branch below AND the admin fraud queue's "Clear" action
// (controllers/admin/fraud.controller.js), which is exactly the same
// capture a webhook would have performed had the payment not been held for
// review first (§3: "no parallel path"). Mutates `payment`/`booking` in
// place; the caller saves both.
async function capturePayment(payment, booking) {
  const updatedTour = await deductSeat(booking.tour, booking.departureId, booking.seats);
  if (!updatedTour) {
    payment.status = "failed";
    payment.failureReason = FAIL_REASONS["sold-out"];
    booking.paymentState = "failed";
    booking.status = "failed";
    booking.outcomeReason = FAIL_REASONS["sold-out"];
    booking.outcomeKind = "sold-out";
    return { ok: false, reason: "sold-out" };
  }

  payment.status = "confirmed";
  booking.paymentState = "confirmed";
  booking.status = "confirmed";
  booking.outcomeKind = "confirmed";

  // Plan-driven commission, CLAUDE.md §3: read the vendor's own subscribed
  // rate first, falling back to Policy.commissionPct only when the tour has
  // no real owner (legacy/seed data) or the vendor has no active/grace
  // subscription.
  const vendorRate = await subscriptionService.getCommissionRate(updatedTour.ownerId);
  const rate = vendorRate ?? (await Policy.getSingleton()).commissionPct / 100;
  await ledgerService.accrueCommission({
    ref: booking.ref,
    party: updatedTour.operator,
    label: `Commission on ${booking.ref}`,
    gross: booking.amounts.total,
    rate,
    via: booking.method,
  });
  return { ok: true };
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
    booking.outcomeKind = "held";
  } else if (status === "failed") {
    payment.status = "failed";
    payment.failureReason = FAIL_REASONS.failed;
    booking.paymentState = "failed";
    booking.status = "failed";
    booking.outcomeReason = FAIL_REASONS.failed;
    booking.outcomeKind = "failed";
  } else if (isLate) {
    payment.status = "failed";
    payment.failureReason = FAIL_REASONS.late;
    booking.paymentState = "failed";
    booking.status = "failed";
    booking.outcomeReason = FAIL_REASONS.late;
    booking.outcomeKind = "late";
  } else if (status === "confirmed") {
    await capturePayment(payment, booking);
  }

  await payment.save();
  await booking.save();

  return { ok: true, paymentStatus: payment.status };
}

module.exports = { processPaymentWebhook, capturePayment, deductSeat, restoreSeat, FAIL_REASONS };
