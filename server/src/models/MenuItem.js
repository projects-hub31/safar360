const mongoose = require("mongoose");

// Toggling a dish off never deletes it or its price history (§6 menu) —
// `on` is the only mutable field a toggle ever touches.
const menuItemSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    on: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MenuItem", menuItemSchema);
