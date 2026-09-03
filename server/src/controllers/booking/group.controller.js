const Tour = require("../../models/Tour");
const GroupSplit = require("../../models/GroupSplit");
const Booking = require("../../models/Booking");
const Policy = require("../../models/Policy");
const ApiError = require("../../utils/ApiError");
const { ok } = require("../../utils/respond");
const { genBookingRef } = require("../../utils/reference-numbers");
const ledgerService = require("../../services/ledger.service");
const subscriptionService = require("../../services/subscription.service");
const { deductSeat } = require("../../services/webhook.service");

const SERVICE_FEE_PCT = 0.04; // mirrors client/src/context/booking/booking-context.js
const GROUP_WINDOW_HOURS = 24; // §3 group-split all-or-nothing window

function toDto(g) {
  const seats = g.participants.length;
  const subtotal = g.price * seats;
  const fee = Math.round(subtotal * SERVICE_FEE_PCT);
  return {
    id: g._id,
    tourId: g.tour,
    departureId: g.departureId,
    title: g.tourTitle,
    price: g.price,
    seats,
    total: subtotal + fee,
    deadlineAt: g.deadlineAt,
    status: g.status,
    participants: g.participants.map((p) => ({ name: p.name, status: p.status, paidAt: p.paidAt })),
    bookingRef: g.bookingRef,
    outcomeReason: g.outcomeReason,
  };
}

// Same "check on read, no cron/queue infra exists yet" pattern as
// booking.controller.js's settleIfLapsed and subscription.service.js's
// settleTimers.
async function settleIfLapsed(group) {
  if (group.status === "open" && group.deadlineAt.getTime() < Date.now()) {
    const unpaid = group.participants.filter((p) => p.status !== "paid").length;
    group.status = "lapsed";
    group.outcomeReason = `The 24-hour window closed with ${unpaid} unpaid. Everyone who paid has been refunded in full.`;
    await group.save();
  }
  return group;
}

// POST /api/booking/group/start — requires auth (the organizer). No lock and
// no charge happens here — this only opens the window; each participant's
// own payment is the real event (§3).
async function start(req, res, next) {
  try {
    const { tourId, departureId, participantNames } = req.body;
    const names = Array.isArray(participantNames) ? participantNames.map((n) => String(n).trim()).filter(Boolean) : [];
    if (!tourId || !departureId || names.length < 2) {
      throw new ApiError(400, "MISSING_FIELDS", "A tour, a departure and at least 2 participants are required.");
    }

    const tour = await Tour.findById(tourId);
    if (!tour || !tour.published) throw new ApiError(404, "TOUR_NOT_FOUND", "This tour doesn't exist or is no longer listed.");
    if (tour.bookingMode !== "instant") throw new ApiError(400, "WRONG_BOOKING_MODE", "Group splits only apply to instant-book tours.");

    const departure = tour.departures.id(departureId);
    if (!departure) throw new ApiError(404, "DEPARTURE_NOT_FOUND", "This departure date doesn't exist.");
    // Soft check only, same as startLock — the real anti-oversell gate is the
    // atomic deduction once every participant has actually paid.
    if (departure.seatsLeft < names.length) {
      throw new ApiError(409, "SOLD_OUT", "Not enough seats left on this departure for the whole group.");
    }

    const group = await GroupSplit.create({
      organizer: req.user.id,
      tour: tour._id,
      departureId: departure._id,
      tourTitle: tour.title,
      price: tour.price,
      cancellationPolicy: tour.cancellationPolicy,
      deadlineAt: new Date(Date.now() + GROUP_WINDOW_HOURS * 3600000),
      participants: names.map((name) => ({ name, status: "unpaid" })),
    });

    ok(res, toDto(group), 201);
  } catch (err) {
    next(err);
  }
}

// GET /api/booking/group/:id — public: a participant with no account needs
// to be able to check the split's live status via nothing but the link (§3).
async function getStatus(req, res, next) {
  try {
    const group = await GroupSplit.findById(req.params.id);
    if (!group) throw new ApiError(404, "GROUP_NOT_FOUND", "This group split doesn't exist.");
    await settleIfLapsed(group);
    ok(res, toDto(group));
  } catch (err) {
    next(err);
  }
}

// POST /api/booking/group/:id/participants/:index/pay — public, no account
// needed (§3). The window's last payment is the real capture point: only
// once every participant has paid does the atomic seat deduction, real
// Booking, and commission accrual fire — never before.
async function payShare(req, res, next) {
  try {
    const group = await GroupSplit.findById(req.params.id);
    if (!group) throw new ApiError(404, "GROUP_NOT_FOUND", "This group split doesn't exist.");
    await settleIfLapsed(group);
    if (group.status === "lapsed") {
      throw new ApiError(409, "WINDOW_CLOSED", group.outcomeReason || "This window has already closed.");
    }
    if (group.status === "confirmed") {
      // Idempotent — the booking already exists, nothing left for this call to do.
      return ok(res, toDto(group));
    }

    const index = Number(req.params.index);
    const participant = group.participants[index];
    if (!participant) throw new ApiError(404, "PARTICIPANT_NOT_FOUND", "This participant doesn't exist on this split.");

    if (participant.status !== "paid") {
      participant.status = "paid";
      participant.paidAt = new Date();
    }

    const allPaid = group.participants.every((p) => p.status === "paid");
    if (!allPaid) {
      await group.save();
      return ok(res, toDto(group));
    }

    const seats = group.participants.length;
    const updatedTour = await deductSeat(group.tour, group.departureId, seats);
    if (!updatedTour) {
      // Someone else took the seats moments before the group finished paying
      // — same honest sold-out/late-webhook outcome as the instant-checkout
      // path, never an oversell. No real gateway exists to actually reverse
      // a charge (§9), same as every other flow in this pass.
      group.status = "lapsed";
      group.outcomeReason = "Seats sold out just as the group finished paying. Everyone who paid is refunded in full.";
      await group.save();
      return ok(res, toDto(group));
    }

    const subtotal = group.price * seats;
    const fee = Math.round(subtotal * SERVICE_FEE_PCT);
    const total = subtotal + fee;

    const booking = await Booking.create({
      ref: genBookingRef(),
      user: group.organizer,
      tour: group.tour,
      tourTitle: group.tourTitle,
      departureId: group.departureId,
      departureDate: updatedTour.departures.id(group.departureId)?.date,
      seats,
      guests: [],
      amounts: { subtotal, discount: 0, fee, total },
      method: "group",
      bookingMode: "instant",
      cancellationPolicy: group.cancellationPolicy,
      paymentState: "confirmed",
      status: "confirmed",
    });

    const vendorRate = await subscriptionService.getCommissionRate(updatedTour.ownerId);
    const rate = vendorRate ?? (await Policy.getSingleton()).commissionPct / 100;
    await ledgerService.accrueCommission({
      ref: booking.ref,
      party: updatedTour.operator,
      label: `Commission on ${booking.ref}`,
      gross: total,
      rate,
      via: "group-split",
    });

    group.status = "confirmed";
    group.bookingRef = booking.ref;
    await group.save();

    ok(res, toDto(group));
  } catch (err) {
    next(err);
  }
}

module.exports = { start, getStatus, payShare };
