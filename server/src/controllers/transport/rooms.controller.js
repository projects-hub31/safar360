const Room = require("../../models/Room");
const RoomBooking = require("../../models/RoomBooking");
const User = require("../../models/User");
const ApiError = require("../../utils/ApiError");
const { ok } = require("../../utils/respond");
const { roomRate } = require("../../utils/transport");
const { genBookingRef } = require("../../utils/reference-numbers");
const { decideOutcome, FRAUD_AMOUNT_THRESHOLD } = require("../../services/payment-gateway.mock");

const FAIL_REASONS = {
  failed: "Your card was declined by the issuing bank. Nothing was charged.",
  held: "Score above the review threshold — a human checks this within the hour.",
  "sold-out": "This room was booked by someone else moments ago. Nothing was charged.",
};

function toDto(r) {
  return { id: r._id, name: r.name, capacity: r.capacity, nightlyRate: r.nightlyRate, total: r.total, booked: r.booked };
}

// --- owner CRUD ------------------------------------------------------------
async function create(req, res, next) {
  try {
    const { name, capacity, nightlyRate, total } = req.body;
    if (!name || !(capacity > 0) || !(nightlyRate > 0) || !(total >= 0)) {
      throw new ApiError(400, "MISSING_FIELDS", "name, capacity, nightlyRate and total are required.");
    }
    const room = await Room.create({ ownerId: req.user.id, name, capacity, nightlyRate, total });
    ok(res, toDto(room), 201);
  } catch (err) {
    next(err);
  }
}

async function listMine(req, res, next) {
  try {
    const rooms = await Room.find({ ownerId: req.user.id }).sort({ createdAt: 1 });
    ok(res, rooms.map(toDto));
  } catch (err) {
    next(err);
  }
}

// PATCH /api/transport/rooms/:id — hard floor at `booked`, same pattern as
// a vendor listing's departure seats (§6).
async function setTotal(req, res, next) {
  try {
    const { total } = req.body;
    const room = await Room.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!room) throw new ApiError(404, "ROOM_NOT_FOUND", "Room not found.");
    if (total < room.booked) {
      throw new ApiError(409, "BELOW_BOOKED_FLOOR", `Can't go below ${room.booked} — that many rooms of this type are already booked.`);
    }
    room.total = total;
    await room.save();
    ok(res, toDto(room));
  } catch (err) {
    next(err);
  }
}

// --- traveller: real payment, real availability (§6 "Rooms are booked,
// enquiries are not") ------------------------------------------------------
// One call, no soft-lock — CLAUDE.md §8's own note: nothing in the source
// spec documents a hold requirement for a room the way it does a tour seat.
// Reuses the exact same deterministic decision function the real booking
// webhook path uses (payment-gateway.mock.js's decideOutcome), just without
// the pending/async webhook step, since nothing here needs a display
// countdown either.
async function book(req, res, next) {
  try {
    const { checkIn, nights, guests, method, methodDetail } = req.body;
    if (!checkIn || !(nights > 0) || !(guests > 0) || !method) {
      throw new ApiError(400, "MISSING_FIELDS", "checkIn, nights, guests and method are required.");
    }
    const room = await Room.findById(req.params.id);
    if (!room) return ok(res, { kind: "sold-out", reason: FAIL_REASONS["sold-out"] });

    const rate = roomRate(room.nightlyRate, checkIn);
    const total = rate * nights;
    const outcome = decideOutcome({ amount: total, method, methodDetail });

    if (outcome.status === "failed") return ok(res, { kind: "failed", reason: FAIL_REASONS.failed });
    if (outcome.status === "held") return ok(res, { kind: "held", reason: FAIL_REASONS.held });

    // The atomic anti-oversell check (§3's exact pattern, adapted: booked <
    // total via $expr rather than a $gte seat filter, since a room's cap is
    // one plain field, not a per-departure array entry).
    const updated = await Room.findOneAndUpdate(
      { _id: room._id, $expr: { $lt: ["$booked", "$total"] } },
      { $inc: { booked: 1 } },
      { returnDocument: "after" }
    );
    if (!updated) return ok(res, { kind: "sold-out", reason: FAIL_REASONS["sold-out"] });

    // req.user only carries {id, role, adminRole} from the JWT — a real
    // lookup is required for the traveller's actual name (same gap fixed in
    // leads.controller.js's create()).
    let fallbackName = "Traveller";
    if (!req.body.guestName) {
      const traveller = await User.findById(req.user.id);
      fallbackName = traveller?.name || "Traveller";
    }

    const ref = genBookingRef();
    await RoomBooking.create({
      ref, room: room._id, traveller: req.user.id, guestName: req.body.guestName || fallbackName,
      checkIn: new Date(checkIn), nights, guests, rate, total, method, methodDetail, state: "confirmed",
    });
    ok(res, { kind: "confirmed", ref, total }, 201);
  } catch (err) {
    next(err);
  }
}

async function myBookings(req, res, next) {
  try {
    const bookings = await RoomBooking.find({ traveller: req.user.id }).populate("room").sort({ createdAt: -1 });
    ok(res, bookings.map((b) => ({
      ref: b.ref,
      roomId: b.room?._id,
      roomName: b.room?.name || "Room",
      checkIn: b.checkIn,
      nights: b.nights,
      guests: b.guests,
      rate: b.rate,
      total: b.total,
      method: b.method,
      guestName: b.guestName,
      state: b.state,
      at: b.createdAt,
    })));
  } catch (err) {
    next(err);
  }
}

async function cancelBooking(req, res, next) {
  try {
    const booking = await RoomBooking.findOne({ ref: req.params.ref, traveller: req.user.id });
    if (!booking) throw new ApiError(404, "BOOKING_NOT_FOUND", "Room booking not found.");
    if (booking.state !== "confirmed") throw new ApiError(409, "NOT_CANCELLABLE", "Only a confirmed reservation can be cancelled.");

    await Room.updateOne({ _id: booking.room }, { $inc: { booked: -1 } });
    booking.state = "cancelled";
    await booking.save();
    ok(res, { ref: booking.ref, state: "cancelled" });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, listMine, setTotal, book, myBookings, cancelBooking, toDto };
