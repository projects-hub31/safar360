const mongoose = require("mongoose");

// A room reservation resolves in one call (§8 module 05 note: "nothing in
// the source spec documents a soft-lock requirement for a room the way it
// does for a tour seat") — only a real capture ever creates a row here;
// failed/held/sold-out outcomes never touch the database at all, mirroring
// the client mock's own original behavior exactly.
const roomBookingSchema = new mongoose.Schema(
  {
    ref: { type: String, required: true, unique: true, index: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    traveller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    guestName: String,
    checkIn: { type: Date, required: true },
    nights: { type: Number, required: true },
    guests: { type: Number, required: true },
    rate: { type: Number, required: true }, // the season-adjusted nightly rate actually charged
    total: { type: Number, required: true },
    method: String,
    methodDetail: String,
    state: { type: String, enum: ["confirmed", "cancelled"], default: "confirmed" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RoomBooking", roomBookingSchema);
