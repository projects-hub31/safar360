const mongoose = require("mongoose");

// The vendor publish-gate's subscription half (CLAUDE.md §3 — full 5-state
// transition table). One document per vendor. `commissionPct`/`listingCap`
// are copied from the plan table at subscribe time onto the document itself
// (not re-read from the table live) so a vendor's rate doesn't silently
// shift if the plan table is edited later — matches §3's "Vendor/Seller
// documents should carry their own commission-rate field" instruction.
const subscriptionSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    plan: { type: String, enum: ["Starter", "Growth", "Pro"], required: true },
    state: {
      type: String,
      enum: ["active", "past_due", "grace", "suspended", "cancelled", "purged"],
      required: true,
      default: "active",
    },
    commissionPct: { type: Number, required: true },
    listingCap: { type: Number, default: null }, // null = unlimited
    retryCount: { type: Number, default: 0 },
    currentPeriodEnd: Date,
    pastDueAt: Date,
    graceStartedAt: Date,
    suspendedAt: Date,
    cancelledAt: Date,
    purgedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
