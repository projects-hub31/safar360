const mongoose = require("mongoose");

// "6 states, not 3" single shared money-record shape, CLAUDE.md §3 —
// commission accrual, referral commission and payouts all write this same
// collection through ledger.service.js, never a second copy.
const ledgerRowSchema = new mongoose.Schema(
  {
    ledgerId: { type: String, required: true, unique: true, index: true },
    kind: { type: String, enum: ["commission", "referral", "payout"], required: true },
    ref: { type: String, required: true, index: true }, // booking ref / order ref this row is tied to
    party: { type: String, required: true }, // vendor/operator/influencer name or id string
    label: String,
    gross: { type: Number, required: true },
    rate: { type: Number, required: true }, // fraction, e.g. 0.12
    commission: { type: Number, required: true },
    net: { type: Number, required: true },
    state: {
      type: String,
      enum: ["accruing", "accrued", "pending", "released", "held_dispute", "reversed"],
      default: "accruing",
    },
    via: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("LedgerRow", ledgerRowSchema);
