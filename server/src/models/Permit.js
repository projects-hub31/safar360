const mongoose = require("mongoose");

// A real `expiresAt` date, not a decaying `daysLeft` counter (§7's own
// rule elsewhere: compute live, never store a value that only "counts down"
// if something remembers to tick it) — `daysLeft` is derived at read time
// (controllers/transport/permits.controller.js's toDto).
const permitSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    number: { type: String, required: true }, // e.g. "GB-DNP-2026-0881", CLAUDE.md §4
    region: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Permit", permitSchema);
