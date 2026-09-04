const Payment = require("../../models/Payment");
const Booking = require("../../models/Booking");
const ApiError = require("../../utils/ApiError");
const { ok } = require("../../utils/respond");
const { capturePayment } = require("../../services/webhook.service");
const ledgerService = require("../../services/ledger.service");
const { logAudit, actorNameFor } = require("../../services/audit.service");

// A real payment's `status` enum (pending/confirmed/failed/held) has no
// 'cleared'/'refunded'/'ask-id' values of its own — those are fraud-review
// *resolutions* of a held payment, not new payment states (§3's own
// distinction: "three resolution actions map to ordinary actions"). Derived
// here from status + fraudAskedForId rather than adding fraud-specific
// values to the core payment state machine.
function displayStatus(payment) {
  if (payment.status === "held") return payment.fraudAskedForId ? "ask-id" : "held";
  if (payment.status === "confirmed") return "cleared";
  if (payment.status === "failed") return "refunded";
  return payment.status;
}

async function toDto(payment) {
  const booking = await Booking.findById(payment.booking).populate("user");
  return {
    id: payment._id,
    bookingRef: booking?.ref,
    traveller: booking?.user?.name || "Traveller",
    amount: payment.amount,
    submittedAt: payment.createdAt,
    resolvedAt: payment.status === "held" ? null : payment.updatedAt,
    status: displayStatus(payment),
    score: payment.fraudScore,
    factors: payment.fraudFactors,
    linkedLedgerRef: booking?.status === "confirmed" ? booking.ref : null,
  };
}

// GET /api/admin/fraud — every payment that ever went through fraud scoring
// (fraudScore > 0), not just currently-held ones, so cleared/refunded rows
// stay visible in their resolved state (matching the seeded demo's own
// 3-row history shape).
async function list(req, res, next) {
  try {
    const payments = await Payment.find({ fraudScore: { $gt: 0 } }).sort({ createdAt: -1 });
    ok(res, await Promise.all(payments.map(toDto)));
  } catch (err) {
    next(err);
  }
}

async function findHeld(id) {
  const payment = await Payment.findById(id);
  if (!payment) throw new ApiError(404, "PAYMENT_NOT_FOUND", "Payment not found.");
  if (payment.status !== "held") throw new ApiError(409, "NOT_HELD", "This payment has already been resolved.");
  return payment;
}

// POST /api/admin/fraud/:id/clear — Clear -> setPaymentState(confirmed),
// via the exact same real capture path a webhook would have run (§3: "no
// parallel path") — including the atomic anti-oversell check, so clearing a
// held payment can still legitimately resolve to sold-out if the seat is
// gone by now.
async function clear(req, res, next) {
  try {
    const payment = await findHeld(req.params.id);
    const booking = await Booking.findById(payment.booking);
    await capturePayment(payment, booking);
    await payment.save();
    await booking.save();

    const actorName = await actorNameFor(req.user.id);
    await logAudit({ actorId: req.user.id, actorName, action: "Fraud review cleared", target: booking.ref, category: "money", tone: "success" });
    ok(res, await toDto(payment));
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/fraud/:id/refund — Refund -> setPaymentState(failed) +
// reverseLedger. Nothing was ever captured for a held payment, so
// reverseLedger is a defensive no-op here (matches nothing) rather than a
// real clawback — kept for parity with every other cancellation path, §3.
async function refund(req, res, next) {
  try {
    const payment = await findHeld(req.params.id);
    const booking = await Booking.findById(payment.booking);

    payment.status = "failed";
    payment.failureReason = "Held for fraud review, then refunded by an admin.";
    booking.paymentState = "failed";
    booking.status = "failed";
    booking.outcomeReason = payment.failureReason;
    booking.outcomeKind = "failed";
    await payment.save();
    await booking.save();
    await ledgerService.reverseLedger(booking.ref);

    const actorName = await actorNameFor(req.user.id);
    await logAudit({ actorId: req.user.id, actorName, action: "Fraud review refunded", target: booking.ref, category: "money", tone: "held" });
    ok(res, await toDto(payment));
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/fraud/:id/ask-id — holds without penalizing (§3): the one
// resolution that changes nothing about the payment/booking state itself.
async function askForId(req, res, next) {
  try {
    const payment = await findHeld(req.params.id);
    payment.fraudAskedForId = true;
    await payment.save();

    const booking = await Booking.findById(payment.booking);
    const actorName = await actorNameFor(req.user.id);
    await logAudit({ actorId: req.user.id, actorName, action: "Fraud review — asked traveller for ID", target: booking?.ref || String(payment._id), category: "money", tone: "warning" });
    ok(res, await toDto(payment));
  } catch (err) {
    next(err);
  }
}

module.exports = { list, clear, refund, askForId };
