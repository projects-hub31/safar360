const Tour = require("../../models/Tour");
const Booking = require("../../models/Booking");
const Payment = require("../../models/Payment");
const Policy = require("../../models/Policy");
const ApiError = require("../../utils/ApiError");
const { ok } = require("../../utils/respond");
const { isValidCnic } = require("../../utils/validators");
const { genBookingRef, genPaymentId } = require("../../utils/reference-numbers");
const { refundPct } = require("../../utils/cancellationPolicy");
const lockService = require("../../services/lock.service");
const ledgerService = require("../../services/ledger.service");
const gateway = require("../../services/payment-gateway.mock");
const { restoreSeat, deductSeat } = require("../../services/webhook.service");

const SERVICE_FEE_PCT = 0.04;
const PROMO_CODES = { NORTH10: 10 }; // mirrors client/src/context/booking/booking-context.js
const REQUEST_WINDOW_HOURS = 24;

function findDeparture(tour, departureId) {
  return tour.departures.id(departureId);
}

// A pending request-mode booking whose 24h window has quietly elapsed is
// flipped to `declined` lazily, on next read — no cron/queue infra exists
// yet, so this mirrors the same "check on read" approach as the Lock TTL
// belt-and-suspenders check (lock.service.js).
async function settleIfLapsed(booking) {
  if (
    booking.bookingMode === "request" &&
    booking.requestState === "pending" &&
    booking.requestDeadline &&
    booking.requestDeadline.getTime() < Date.now()
  ) {
    booking.requestState = "declined";
    booking.status = "declined";
    booking.outcomeReason = "The operator didn't respond within 24 hours. Nothing was ever charged.";
    await booking.save();
  }
  return booking;
}

// POST /api/booking/lock — reserve a 10-minute checkout window without
// deducting anything (CLAUDE.md §3).
async function startLock(req, res, next) {
  try {
    const { tourId, departureId, seats } = req.body;
    if (!tourId || !departureId || !seats || seats < 1) {
      throw new ApiError(400, "MISSING_FIELDS", "tourId, departureId and seats are required.");
    }

    const tour = await Tour.findById(tourId);
    if (!tour || !tour.published) throw new ApiError(404, "TOUR_NOT_FOUND", "This tour doesn't exist or is no longer listed.");
    if (tour.bookingMode !== "instant") throw new ApiError(400, "WRONG_BOOKING_MODE", "This tour is request-to-book, not instant.");

    const departure = findDeparture(tour, departureId);
    if (!departure) throw new ApiError(404, "DEPARTURE_NOT_FOUND", "This departure date doesn't exist.");
    // UX-only check — the real anti-oversell gate is the atomic deduction at
    // capture time (webhook.service.js). Multiple travellers may legitimately
    // hold overlapping locks on the same last seats; that's by design.
    if (departure.seatsLeft < seats) {
      throw new ApiError(409, "SOLD_OUT", "Not enough seats left on this departure.");
    }

    const lock = await lockService.createLock({
      tourId: tour._id,
      departureId: departure._id,
      departureDate: departure.date,
      seats,
      userId: req.user.id,
      title: tour.title,
      price: tour.price,
      cancellationPolicy: tour.cancellationPolicy,
    });

    ok(res, {
      lockId: lock._id,
      tourId: tour._id,
      departureId: departure._id,
      title: tour.title,
      price: tour.price,
      seats,
      minutes: lockService.LOCK_MINUTES,
      expiresAt: lock.expiresAt,
      cancellationPolicy: tour.cancellationPolicy,
    }, 201);
  } catch (err) {
    next(err);
  }
}

function computeTotals(price, seats, promoCode) {
  const subtotal = price * seats;
  const pct = promoCode ? PROMO_CODES[String(promoCode).toUpperCase()] || 0 : 0;
  const discount = Math.round(subtotal * (pct / 100));
  const fee = Math.round((subtotal - discount) * SERVICE_FEE_PCT);
  return { subtotal, discount, fee, total: subtotal - discount + fee, appliedPromo: pct ? String(promoCode).toUpperCase() : null };
}

// POST /api/booking/checkout — creates the Booking + Payment, kicks off the
// mock gateway, and returns immediately with `pending` (the awaiting screen
// polls /status; the webhook is the sole authority on the outcome, §3).
async function checkout(req, res, next) {
  try {
    const { lockId, guests, method, methodDetail, promoCode } = req.body;
    if (!lockId || !method) throw new ApiError(400, "MISSING_FIELDS", "lockId and method are required.");

    const lock = await lockService.getLiveLock(lockId, req.user.id);

    const guestList = Array.isArray(guests) ? guests : [];
    if (guestList.length !== lock.seats) {
      throw new ApiError(400, "GUEST_COUNT_MISMATCH", `Enter details for all ${lock.seats} guest(s).`);
    }
    const badCnic = guestList.find((g) => !isValidCnic(g.cnic));
    if (badCnic) throw new ApiError(400, "INVALID_CNIC", "A CNIC is 13 digits as 00000-0000000-0. Check the number on the card.");

    const { subtotal, discount, fee, total, appliedPromo } = computeTotals(lock.price, lock.seats, promoCode);

    const booking = await Booking.create({
      ref: genBookingRef(),
      user: req.user.id,
      tour: lock.tour,
      tourTitle: lock.title,
      departureId: lock.departureId,
      departureDate: lock.departureDate,
      seats: lock.seats,
      guests: guestList,
      amounts: { subtotal, discount, fee, total },
      promoCode: appliedPromo,
      method,
      methodDetail,
      bookingMode: "instant",
      cancellationPolicy: lock.cancellationPolicy,
      lockExpiresAt: lock.expiresAt,
      paymentState: "pending",
      status: "pending",
    });

    // The lock's job — bounding this one checkout attempt — is done the
    // moment it's submitted. Releasing it now (rather than leaving it live
    // until the webhook resolves) is what stops a double-submit on the same
    // lockId from creating a second Booking/Payment; `lockExpiresAt` above
    // is what the webhook checks for a late-arriving confirmation instead.
    await lockService.releaseLock(lock._id);

    const paymentId = genPaymentId();
    await Payment.create({
      paymentId,
      booking: booking._id,
      amount: total,
      method,
      methodDetail,
      status: "pending",
    });

    // Fire-and-forget: the mock gateway resolves this asynchronously via the
    // real webhook path a few seconds later (payment-gateway.mock.js).
    gateway.chargeAsync({ paymentId, bookingId: booking._id, amount: total, method, methodDetail });

    ok(res, { ref: booking.ref, paymentId, status: "pending" }, 201);
  } catch (err) {
    next(err);
  }
}

// GET /api/booking/status/:ref — polled by the "awaiting" screen.
async function getStatus(req, res, next) {
  try {
    const booking = await Booking.findOne({ ref: req.params.ref, user: req.user.id });
    if (!booking) throw new ApiError(404, "BOOKING_NOT_FOUND", "Booking not found.");
    await settleIfLapsed(booking);

    ok(res, {
      ref: booking.ref,
      status: booking.status,
      paymentState: booking.paymentState,
      requestState: booking.requestState,
      outcomeReason: booking.outcomeReason,
      outcomeKind: booking.outcomeKind,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/booking/history
async function history(req, res, next) {
  try {
    const bookings = await Booking.find({ user: req.user.id }).sort({ createdAt: -1 });
    await Promise.all(bookings.map(settleIfLapsed));

    ok(res, bookings.map((b) => ({
      ref: b.ref,
      tourId: b.tour,
      title: b.tourTitle,
      seats: b.seats,
      total: b.amounts?.total,
      method: b.method,
      status: b.status,
      paymentState: b.paymentState,
      requestState: b.requestState,
      guests: b.guests,
      departureAt: b.departureDate,
      cancellationPolicy: b.cancellationPolicy,
      refundPct: b.refundPct,
      refundAmount: b.refundAmount,
      at: b.createdAt,
    })));
  } catch (err) {
    next(err);
  }
}

// POST /api/booking/:ref/cancel — tiered refund read from the booking's own
// (listing-snapshotted) cancellation policy, CLAUDE.md §3. `operator`-caused
// reasons always force 100% regardless of tier.
async function cancelBooking(req, res, next) {
  try {
    const { reason } = req.body;
    const booking = await Booking.findOne({ ref: req.params.ref, user: req.user.id });
    if (!booking) throw new ApiError(404, "BOOKING_NOT_FOUND", "Booking not found.");
    if (booking.status !== "confirmed") {
      throw new ApiError(409, "NOT_CANCELLABLE", "Only a confirmed booking can be cancelled.");
    }

    const hoursUntilDeparture = booking.departureDate
      ? Math.max(0, (booking.departureDate.getTime() - Date.now()) / 3600000)
      : 999;
    const pct = reason === "operator" ? 100 : refundPct(booking.cancellationPolicy, hoursUntilDeparture);
    const amount = Math.round(booking.amounts.total * (pct / 100));

    await restoreSeat(booking.tour, booking.departureId, booking.seats);

    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    booking.cancelReason = reason;
    booking.refundPct = pct;
    booking.refundAmount = amount;
    await booking.save();

    await ledgerService.reverseLedger(booking.ref);

    ok(res, { pct, amount });
  } catch (err) {
    next(err);
  }
}

// POST /api/booking/request — request-to-book (operator-mediated): no lock,
// no charge, no seat touched until the operator explicitly accepts (§3).
async function createRequest(req, res, next) {
  try {
    const { tourId, departureId, seats, guests } = req.body;
    if (!tourId || !departureId || !seats || seats < 1) {
      throw new ApiError(400, "MISSING_FIELDS", "tourId, departureId and seats are required.");
    }

    const tour = await Tour.findById(tourId);
    if (!tour || !tour.published) throw new ApiError(404, "TOUR_NOT_FOUND", "This tour doesn't exist or is no longer listed.");
    if (tour.bookingMode !== "request") throw new ApiError(400, "WRONG_BOOKING_MODE", "This tour books instantly — use the hold/checkout flow.");

    const departure = findDeparture(tour, departureId);
    if (!departure) throw new ApiError(404, "DEPARTURE_NOT_FOUND", "This departure date doesn't exist.");

    const guestList = Array.isArray(guests) ? guests : [];
    const badCnic = guestList.find((g) => !isValidCnic(g.cnic));
    if (badCnic) throw new ApiError(400, "INVALID_CNIC", "A CNIC is 13 digits as 00000-0000000-0. Check the number on the card.");

    const { subtotal, discount, fee, total } = computeTotals(tour.price, seats, null);

    const booking = await Booking.create({
      ref: genBookingRef(),
      user: req.user.id,
      tour: tour._id,
      tourTitle: tour.title,
      departureId: departure._id,
      departureDate: departure.date,
      seats,
      guests: guestList,
      amounts: { subtotal, discount, fee, total },
      bookingMode: "request",
      cancellationPolicy: tour.cancellationPolicy,
      requestState: "pending",
      requestDeadline: new Date(Date.now() + REQUEST_WINDOW_HOURS * 3600000),
      status: "awaiting-accept",
    });

    ok(res, { ref: booking.ref, deadlineAt: booking.requestDeadline }, 201);
  } catch (err) {
    next(err);
  }
}

// POST /api/booking/:ref/operator-decision — the operator side of the
// request-to-book lifecycle. Lightweight stand-in for the real vendor
// module's inbox (days 8-9 of §9); scoped here only so the traveller-facing
// request flow has somewhere real to resolve to instead of dangling forever.
async function operatorDecision(req, res, next) {
  try {
    const { action, reason } = req.body;
    const booking = await Booking.findOne({ ref: req.params.ref });
    if (!booking) throw new ApiError(404, "BOOKING_NOT_FOUND", "Booking not found.");
    if (booking.bookingMode !== "request" || booking.requestState !== "pending") {
      throw new ApiError(409, "NOT_PENDING", "This request has already been resolved.");
    }
    await settleIfLapsed(booking);
    if (booking.requestState !== "pending") {
      throw new ApiError(409, "WINDOW_ELAPSED", "The 24h response window already elapsed — this request auto-declined.");
    }

    if (action === "accept") {
      const updatedTour = await deductSeat(booking.tour, booking.departureId, booking.seats);
      if (!updatedTour) {
        throw new ApiError(409, "SOLD_OUT", "Not enough seats left to accept — decline this request instead.");
      }
      booking.requestState = "accepted";
      booking.status = "confirmed";
      await booking.save();

      const policy = await Policy.getSingleton();
      await ledgerService.accrueCommission({
        ref: booking.ref,
        party: updatedTour.operator,
        label: `Commission on ${booking.ref}`,
        gross: booking.amounts.total,
        rate: policy.commissionPct / 100,
        via: "request-to-book",
      });
    } else if (action === "decline") {
      booking.requestState = "declined";
      booking.status = "declined";
      booking.outcomeReason = reason || "The operator declined this request. Nothing was ever charged.";
      await booking.save();
    } else {
      throw new ApiError(400, "INVALID_ACTION", "action must be 'accept' or 'decline'.");
    }

    ok(res, { ref: booking.ref, status: booking.status });
  } catch (err) {
    next(err);
  }
}

module.exports = { startLock, checkout, getStatus, history, cancelBooking, createRequest, operatorDecision };
