const mongoose = require("mongoose");

// Property room type — the one inventory in module 05 that takes real
// payment (§6: "Rooms are booked, enquiries are not"). `booked` has the same
// hard-floor-at-current-count rule as a vendor listing's departure seats.
const roomSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    capacity: { type: Number, required: true },
    nightlyRate: { type: Number, required: true },
    total: { type: Number, required: true },
    booked: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);
