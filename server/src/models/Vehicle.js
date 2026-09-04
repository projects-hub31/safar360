const mongoose = require("mongoose");

// Module 05 — transport owner's fleet. Visibility in search is a live gate
// (CLAUDE.md §3/§6), never a stored flag: `active` + a valid linked permit
// (when `needsPermit`) — see controllers/discover/vehicles.controller.js.
const vehicleSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, required: true }, // free-text label, e.g. "Jeep · 4×4"
    capacity: { type: Number, required: true },
    active: { type: Boolean, default: true },
    needsPermit: { type: Boolean, default: false },
    permitId: { type: mongoose.Schema.Types.ObjectId, ref: "Permit", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
