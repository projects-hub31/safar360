const mongoose = require("mongoose");

const fraudFactorSchema = new mongoose.Schema({ label: String, weight: Number }, { _id: false });

// CLAUDE.md §3 payment/webhook state machine: idle→pending→confirmed|failed|held.
// `idle` never reaches this collection — a Payment row only exists once a
// charge has actually been attempted at the gateway.
const paymentSchema = new mongoose.Schema(
  {
    paymentId: { type: String, required: true, unique: true, index: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    amount: { type: Number, required: true },
    method: String,
    methodDetail: String,
    status: { type: String, enum: ["pending", "confirmed", "failed", "held"], default: "pending" },
    fraudScore: { type: Number, default: 0 },
    fraudFactors: [fraudFactorSchema],
    failureReason: String,
    webhookVerifiedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
