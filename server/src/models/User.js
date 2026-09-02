const mongoose = require("mongoose");

// The 7 actors, CLAUDE.md §3. `adminRole` only ever applies to role==='admin'.
const ROLES = ["traveller", "operator", "transport", "property", "seller", "influencer", "admin"];
const ADMIN_ROLES = ["super", "sub", "finance"];

const otpSchema = new mongoose.Schema(
  {
    codeHash: String,
    purpose: { type: String, enum: ["register", "login", "reset"] },
    expiresAt: Date,
    attempts: { type: Number, default: 0 },
    lockedUntil: Date,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ROLES, required: true, default: "traveller" },
    adminRole: { type: String, enum: ADMIN_ROLES },
    name: { type: String, trim: true },
    phone: { type: String, trim: true, index: true, sparse: true, unique: true },
    email: { type: String, trim: true, lowercase: true, index: true, sparse: true, unique: true },
    passwordHash: { type: String, required: true },
    verified: { type: Boolean, default: false },
    // Vendor-only publish gate (CLAUDE.md §3 KYC) — travellers/influencers never leave 'none'.
    kycStatus: { type: String, enum: ["none", "pending", "approved", "rejected"], default: "none" },
    otp: otpSchema,
  },
  { timestamps: true }
);

// Never let a password hash leak through res.json(user) by accident.
userSchema.methods.toSafeJSON = function toSafeJSON() {
  const { _id, role, adminRole, name, phone, email, verified, kycStatus, createdAt } = this;
  return { id: _id, role, adminRole, name, phone, email, verified, kycStatus, createdAt };
};

module.exports = mongoose.model("User", userSchema);
module.exports.ROLES = ROLES;
module.exports.ADMIN_ROLES = ADMIN_ROLES;
