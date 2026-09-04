const mongoose = require("mongoose");

const resolutionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["refund", "split", "release"] },
    amount: Number,
    note: String,
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    decidedByName: String, // display-name snapshot at resolution time
    decidedAt: Date,
  },
  { _id: false }
);

// A dispute owns only the two parties' claims and the resolution — the
// cross-module timeline (payment capture, geofence check-in, weather alert,
// operator completion) is read from other modules' own records at query
// time (controllers/admin/disputes.controller.js), never copied in here
// (§3: "reads other collections' events rather than owning its own evidence
// copy"). `operatorClaim` has no real capture mechanism yet — no operator-
// facing "respond to a dispute" screen exists — so it stays null until one
// does, shown as such rather than invented.
const disputeSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    bookingRef: { type: String, required: true },
    traveller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    travellerName: { type: String, required: true }, // display-name snapshot at filing time
    operatorName: String,
    amount: { type: Number, required: true },
    status: { type: String, enum: ["open", "resolved"], default: "open" },
    travellerClaim: { type: String, required: true },
    operatorClaim: { type: String, default: null },
    resolution: { type: resolutionSchema, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dispute", disputeSchema);
