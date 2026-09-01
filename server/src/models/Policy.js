const mongoose = require("mongoose");

// Singleton config document — the live source of truth for the 7 admin-editable
// thresholds (CLAUDE.md §3 "Policy object"). Every module that would otherwise
// hardcode a threshold (fraud, commission default, cancellation window, etc.)
// reads this instead. weatherAuthority/weatherWindKmh ride along as read-only
// context for the weather flow, not part of the 7 admin sliders.
const policySchema = new mongoose.Schema(
  {
    _id: { type: String, default: "singleton" },

    // --- the 7 admin-configurable fields ---
    commissionPct: { type: Number, default: 12, min: 5, max: 25 },
    referralPct: { type: Number, default: 4, min: 1, max: 12 },
    attributionDays: { type: Number, default: 30, min: 1, max: 90 },
    cancelFreeHours: { type: Number, default: 48, min: 0, max: 96 },
    fraudThreshold: { type: Number, default: 0.75, min: 0.5, max: 0.95 },
    weatherDecisionHours: { type: Number, default: 12, min: 2, max: 24 },
    weatherRefundPct: { type: Number, default: 100, min: 50, max: 100 },

    // --- read-only weather-flow context (not admin-edited directly) ---
    weatherAuthority: { type: String, default: "PMD (Pakistan Meteorological Department)" },
    weatherWindKmh: { type: Number, default: 60 },
  },
  { timestamps: true }
);

// There is exactly one Policy document. Use this instead of a raw find/findOne
// anywhere a route or service needs current policy — it creates the default
// document on first read rather than requiring a manual seed step to exist.
policySchema.statics.getSingleton = async function () {
  let doc = await this.findById("singleton");
  if (!doc) {
    doc = await this.create({ _id: "singleton" });
  }
  return doc;
};

module.exports = mongoose.model("Policy", policySchema);
