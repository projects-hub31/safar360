const mongoose = require("mongoose");

// A pricing sheet, not an inventory object (§6: "nothing on this screen
// holds a seat, reserves a vehicle, or takes money") — no seats field here
// on purpose.
const routeSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    fareMode: { type: String, enum: ["whole", "seat"], required: true },
    wholeFare: { type: Number, default: null },
    seatFare: { type: Number, default: null },
    minSeats: { type: Number, default: null }, // required to run, only meaningful for fareMode: 'seat'
  },
  { timestamps: true }
);

module.exports = mongoose.model("Route", routeSchema);
