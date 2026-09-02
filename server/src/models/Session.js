const mongoose = require("mongoose");

// One row per issued refresh token. Rotation-theft detection (CLAUDE.md §4:
// "a rotated refresh token presented twice is treated as theft — revoke
// every session on that account") needs to know, per jti, whether it has
// already been redeemed once — that's `used` below, not just `revoked`.
const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    family: { type: String, required: true, index: true }, // shared across a login's whole rotation chain
    jti: { type: String, required: true, unique: true },
    used: { type: Boolean, default: false },
    revoked: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Auto-clean rows well past their token's own expiry — not the security
// control itself (that's `revoked`/`used`, checked explicitly), just
// housekeeping so the collection doesn't grow unbounded.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Session", sessionSchema);
