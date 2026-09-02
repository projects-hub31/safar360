const mongoose = require("mongoose");

const guestSchema = new mongoose.Schema({ name: String, cnic: String }, { _id: false });

const amountsSchema = new mongoose.Schema(
  { subtotal: Number, discount: Number, fee: Number, total: Number },
  { _id: false }
);

// One booking document covers both the `instant` and `request` booking
// modes (CLAUDE.md §3) — `paymentState` drives the instant-mode payment
// state machine (idle/pending/confirmed/failed/held), `requestState` drives
// the operator-mediated lead-like flow. A given booking only ever uses one
// of the two, matched to its `bookingMode`.
const bookingSchema = new mongoose.Schema(
  {
    ref: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tour: { type: mongoose.Schema.Types.ObjectId, ref: "Tour", required: true },
    tourTitle: String,
    departureId: mongoose.Schema.Types.ObjectId,
    departureDate: Date,
    seats: { type: Number, required: true },
    guests: [guestSchema],
    amounts: amountsSchema,
    promoCode: String,
    method: String,
    methodDetail: String,
    bookingMode: { type: String, enum: ["instant", "request"], required: true },
    cancellationPolicy: { type: String, enum: ["flexible", "standard", "strict"], default: "standard" },
    // Snapshotted from the Lock at checkout time, then the Lock is deleted
    // (its job — bounding one checkout attempt — is done once submitted).
    // The webhook reads this to detect a late-arriving "confirmed" outcome
    // without needing the Lock doc to still exist.
    lockExpiresAt: Date,

    paymentState: {
      type: String,
      enum: ["idle", "pending", "confirmed", "failed", "held"],
      default: "idle",
    },
    requestState: { type: String, enum: ["pending", "accepted", "declined"] },
    requestDeadline: Date,

    outcomeReason: String, // human copy for failed/held/sold-out/late-webhook/declined

    status: {
      type: String,
      enum: ["pending", "awaiting-accept", "confirmed", "declined", "cancelled", "failed", "held", "expired"],
      default: "awaiting-accept",
    },

    cancelledAt: Date,
    cancelReason: String,
    refundPct: Number,
    refundAmount: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
