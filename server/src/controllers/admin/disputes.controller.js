const Dispute = require("../../models/Dispute");
const Booking = require("../../models/Booking");
const Payment = require("../../models/Payment");
const Tour = require("../../models/Tour");
const User = require("../../models/User");
const ApiError = require("../../utils/ApiError");
const { ok } = require("../../utils/respond");
const { restoreSeat } = require("../../services/webhook.service");
const ledgerService = require("../../services/ledger.service");
const { logAudit, actorNameFor } = require("../../services/audit.service");

const RESOLUTION_TYPES = ["refund", "split", "release"];

function toDto(dispute) {
  return {
    id: dispute._id,
    bookingRef: dispute.bookingRef,
    traveller: dispute.travellerName,
    operator: dispute.operatorName,
    amount: dispute.amount,
    filedAt: dispute.createdAt,
    status: dispute.status,
    travellerClaim: dispute.travellerClaim,
    operatorClaim: dispute.operatorClaim,
    // The client's existing shape expects `decidedBy` as a display string
    // (the seeded mock's own `decidedBy: 'You'`) — swap in the real name
    // snapshot rather than the raw ObjectId `decidedBy` field.
    resolution: dispute.resolution ? { ...dispute.resolution.toObject?.() ?? dispute.resolution, decidedBy: dispute.resolution.decidedByName } : null,
  };
}

// A cross-module timeline read live from other modules' own records (§3:
// "reads other collections' events... not a dispute-owned evidence store"),
// never copied onto the Dispute document itself. Only "Payment captured" has
// a real source in this build — geofence check-in, weather alerts, and an
// operator "trip complete" mark have no backend yet (module 08 isn't built,
// and no operator-facing completion action exists either), so those three
// honestly read `at: null` — the same "Not recorded" framing the original
// seeded demo already used for events that genuinely never happened, not a
// shortcut invented for this pass.
async function buildTimeline(booking) {
  const payment = await Payment.findOne({ booking: booking._id }).sort({ createdAt: -1 });
  return [
    { label: "Payment captured", at: payment && payment.status === "confirmed" ? (payment.webhookVerifiedAt || payment.updatedAt) : null, source: "Payments" },
    { label: "Geofence check-in — traveller device", at: null, source: "AI & location" },
    { label: "Weather alert issued for this route", at: null, source: "AI & location" },
    { label: "Operator marked trip complete", at: null, source: "Vendor" },
  ];
}

// POST /api/admin/disputes — traveller-facing, on their own booking. Mounted
// ahead of the admin-only routes below (same shape as the KYC review route's
// own "admin-only mounted before the blanket gate" note).
async function create(req, res, next) {
  try {
    const { bookingRef, claim } = req.body;
    if (!bookingRef || !claim) throw new ApiError(400, "MISSING_FIELDS", "bookingRef and claim are required.");

    const booking = await Booking.findOne({ ref: bookingRef, user: req.user.id });
    if (!booking) throw new ApiError(404, "BOOKING_NOT_FOUND", "Booking not found.");
    if (!["confirmed", "cancelled"].includes(booking.status)) {
      throw new ApiError(409, "NOT_DISPUTABLE", "Only a confirmed or cancelled booking can be disputed.");
    }
    const existing = await Dispute.findOne({ booking: booking._id, status: "open" });
    if (existing) throw new ApiError(409, "ALREADY_OPEN", "There's already an open dispute on this booking.");

    const [tour, traveller] = await Promise.all([Tour.findById(booking.tour), User.findById(req.user.id)]);
    const dispute = await Dispute.create({
      booking: booking._id,
      bookingRef: booking.ref,
      traveller: req.user.id,
      travellerName: traveller?.name || "Traveller",
      operatorName: tour?.operator || null,
      amount: booking.amounts?.total || 0,
      travellerClaim: claim,
      status: "open",
    });
    ok(res, toDto(dispute), 201);
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/disputes — admin (super|finance).
async function list(req, res, next) {
  try {
    const disputes = await Dispute.find().sort({ createdAt: -1 });
    const withTimelines = await Promise.all(disputes.map(async (d) => {
      const booking = await Booking.findById(d.booking);
      return { ...toDto(d), timeline: booking ? await buildTimeline(booking) : [] };
    }));
    ok(res, withTimelines);
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/disputes/:id/resolve — a mandatory reasoning note gates
// all 3 actions (§3). Only `refund` (full) actually restores the seat and
// reverses the accrued commission — `split`/`release` record the decision
// but don't touch inventory/ledger, the same acknowledged simplification the
// client's own pre-existing note already documents (VendorContext's ledger
// row shape only models a full reversal, no partial-amount state).
async function resolve(req, res, next) {
  try {
    const { type, amount, note } = req.body;
    if (!note) throw new ApiError(400, "NOTE_REQUIRED", "A reasoning note is required.");
    if (!RESOLUTION_TYPES.includes(type)) throw new ApiError(400, "INVALID_TYPE", "type must be 'refund', 'split' or 'release'.");

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) throw new ApiError(404, "DISPUTE_NOT_FOUND", "Dispute not found.");
    if (dispute.status !== "open") throw new ApiError(409, "ALREADY_RESOLVED", "This dispute has already been resolved.");

    const actorName = await actorNameFor(req.user.id);
    dispute.status = "resolved";
    dispute.resolution = { type, amount, note, decidedBy: req.user.id, decidedByName: actorName, decidedAt: new Date() };
    await dispute.save();

    if (type === "refund") {
      const booking = await Booking.findById(dispute.booking);
      if (booking && booking.status === "confirmed") {
        await restoreSeat(booking.tour, booking.departureId, booking.seats);
        booking.status = "cancelled";
        booking.cancelledAt = new Date();
        booking.cancelReason = "operator";
        booking.refundPct = 100;
        booking.refundAmount = booking.amounts?.total || 0;
        await booking.save();
        await ledgerService.reverseLedger(booking.ref);
      }
    }

    await logAudit({
      actorId: req.user.id, actorName, action: `Dispute resolved — ${type}`,
      target: `${dispute._id} · ${dispute.bookingRef}`, category: "moderation", tone: "held",
    });
    ok(res, toDto(dispute));
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, resolve };
