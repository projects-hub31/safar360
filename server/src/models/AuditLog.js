const mongoose = require("mongoose");

// One shared, append-only action log every admin mutation writes to (§3
// audit) — including refusals (a payout-batch approval refused for identity
// reasons is logged with `refused: true`, not silently dropped). Row tone by
// action type is a display concern (pages/admin/Audit.jsx), not stored here.
const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    actorName: { type: String, required: true },
    action: { type: String, required: true },
    target: { type: String, required: true },
    category: { type: String, enum: ["kyc", "moderation", "money"], required: true },
    tone: { type: String, enum: ["success", "warning", "danger", "held"], default: "success" },
    refused: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
