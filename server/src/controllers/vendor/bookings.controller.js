const Tour = require("../../models/Tour");
const Booking = require("../../models/Booking");
const ApiError = require("../../utils/ApiError");
const { ok } = require("../../utils/respond");
const { maskCnic } = require("../../utils/validators");
const { DECLINE_REASON_IDS, labelForReason } = require("../../utils/declineReasons");
const { settleIfLapsed } = require("../booking/booking.controller");
const ledgerService = require("../../services/ledger.service");
const subscriptionService = require("../../services/subscription.service");
const Policy = require("../../models/Policy");
const { deductSeat } = require("../../services/webhook.service");

// The real vendor inbox (CLAUDE.md §6 vendor/inbox + booking-detail),
// ownership-scoped by construction — every query here is filtered to tours
// this signed-in operator actually owns, replacing the old ownerless
// `/api/booking/:ref/operator-decision` stand-in (booking.controller.js).

function toDto(b) {
  return {
    id: b.ref,
    ref: b.ref,
    tourId: b.tour,
    title: b.tourTitle,
    seats: b.seats,
    price: b.amounts?.subtotal != null && b.seats ? Math.round(b.amounts.subtotal / b.seats) : null,
    gross: b.amounts?.subtotal,
    total: b.amounts?.total,
    guests: (b.guests || []).map((g) => ({ name: g.name, cnic: maskCnic(g.cnic) })),
    status: b.requestState, // 'pending' | 'accepted' | 'declined' — matches Inbox's tab ids exactly
    deadlineAt: b.requestDeadline,
    outcomeReason: b.outcomeReason,
    autoDeclined: b.autoDeclined,
    at: b.createdAt,
  };
}

async function ownedTourIds(vendorId) {
  const tours = await Tour.find({ ownerId: vendorId }).select("_id");
  return tours.map((t) => t._id);
}

// GET /api/vendor/bookings — every request-mode booking against this
// vendor's own listings. `status` is an optional filter matching the
// client's tab ids (pending/accepted/declined); omit or 'all' for everything.
async function list(req, res, next) {
  try {
    const tourIds = await ownedTourIds(req.user.id);
    const query = { tour: { $in: tourIds }, bookingMode: "request" };
    if (req.query.status && req.query.status !== "all") query.requestState = req.query.status;

    const bookings = await Booking.find(query).sort({ createdAt: -1 });
    await Promise.all(bookings.map(settleIfLapsed));
    // A lazy lapse may have just flipped a row out of the requested filter
    // (pending -> declined) — re-apply the same filter in memory rather than
    // re-querying, since settleIfLapsed already mutated these documents.
    const filtered = req.query.status && req.query.status !== "all"
      ? bookings.filter((b) => b.requestState === req.query.status)
      : bookings;

    ok(res, filtered.map(toDto));
  } catch (err) {
    next(err);
  }
}

// GET /api/vendor/bookings/:ref
async function getOne(req, res, next) {
  try {
    const tourIds = await ownedTourIds(req.user.id);
    const booking = await Booking.findOne({ ref: req.params.ref, tour: { $in: tourIds }, bookingMode: "request" });
    if (!booking) throw new ApiError(404, "BOOKING_NOT_FOUND", "Booking not found.");
    await settleIfLapsed(booking);
    ok(res, toDto(booking));
  } catch (err) {
    next(err);
  }
}

// POST /api/vendor/bookings/:ref/decision — accept deducts the seat and
// accrues commission at this vendor's own plan rate (falling back to the
// Policy default only for an ownerless/legacy tour, same rule the real
// checkout webhook already follows); decline requires exactly one of the 4
// fixed reasons (CLAUDE.md §6). Ownership is enforced by the same tourIds
// filter as the reads above — a vendor can never decide on another vendor's
// booking, closing the gap the old ownerless endpoint left open.
async function decide(req, res, next) {
  try {
    const { action, reason } = req.body;
    if (!["accept", "decline"].includes(action)) {
      throw new ApiError(400, "INVALID_ACTION", "action must be 'accept' or 'decline'.");
    }
    if (action === "decline" && !DECLINE_REASON_IDS.includes(reason)) {
      throw new ApiError(400, "INVALID_REASON", "Pick one of the 4 fixed decline reasons.");
    }

    const tourIds = await ownedTourIds(req.user.id);
    const booking = await Booking.findOne({ ref: req.params.ref, tour: { $in: tourIds }, bookingMode: "request" });
    if (!booking) throw new ApiError(404, "BOOKING_NOT_FOUND", "Booking not found.");

    await settleIfLapsed(booking);
    if (booking.requestState !== "pending") {
      throw new ApiError(409, "NOT_PENDING", "This request has already been resolved.");
    }

    if (action === "accept") {
      const updatedTour = await deductSeat(booking.tour, booking.departureId, booking.seats);
      if (!updatedTour) {
        throw new ApiError(409, "SOLD_OUT", "Not enough seats left to accept — decline this request instead.");
      }
      booking.requestState = "accepted";
      booking.status = "confirmed";
      await booking.save();

      const vendorRate = await subscriptionService.getCommissionRate(updatedTour.ownerId);
      const rate = vendorRate ?? (await Policy.getSingleton()).commissionPct / 100;
      await ledgerService.accrueCommission({
        ref: booking.ref,
        party: updatedTour.operator,
        label: `Commission on ${booking.ref}`,
        gross: booking.amounts.total,
        rate,
        via: "request-to-book",
      });
    } else {
      booking.requestState = "declined";
      booking.status = "declined";
      booking.autoDeclined = false;
      booking.outcomeReason = labelForReason(reason);
      await booking.save();
    }

    ok(res, toDto(booking));
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, decide };
