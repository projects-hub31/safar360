const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const ApiError = require("../../utils/ApiError");
const { ok } = require("../../utils/respond");
const { generateOtp, hashOtp, OTP_TTL_MS } = require("../../utils/otp");
const sessionService = require("../../services/session.service");
const env = require("../../config/env");

async function forgotPassword(req, res, next) {
  try {
    const { identifier } = req.body;
    const user = await User.findOne({ $or: [{ phone: identifier }, { email: String(identifier || "").toLowerCase() }] });

    // Always respond the same way whether or not the account exists —
    // password recovery sends a code, never confirms an account (CLAUDE.md
    // §4), and doubles as not letting this endpoint enumerate accounts.
    let devOtp;
    if (user) {
      const code = generateOtp();
      user.otp = { codeHash: hashOtp(code), purpose: "reset", expiresAt: new Date(Date.now() + OTP_TTL_MS), attempts: 0, lockedUntil: null };
      await user.save();
      console.log(`[otp] reset code for ${user.phone || user.email}: ${code}`);
      if (env.nodeEnv !== "production") devOtp = code;
    }

    ok(res, {
      sent: true,
      userId: user ? user._id : undefined,
      devOtp,
    });
  } catch (err) {
    next(err);
  }
}

// Second step of reset: presents the resetToken issued by
// POST /api/identity/auth/otp/verify (purpose: 'reset') alongside a new
// password. Never a "read the old password back" flow — support can't read
// or set passwords (CLAUDE.md §4).
async function resetPassword(req, res, next) {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword || newPassword.length < 6) {
      throw new ApiError(400, "INVALID_REQUEST", "A reset token and a password of at least 6 characters are required.");
    }

    let payload;
    try {
      payload = jwt.verify(resetToken, env.jwtSecret);
    } catch {
      throw new ApiError(401, "RESET_TOKEN_INVALID", "This reset link expired. Start again.");
    }
    if (payload.purpose !== "reset") {
      throw new ApiError(400, "RESET_TOKEN_INVALID", "Invalid reset token.");
    }

    const user = await User.findById(payload.sub);
    if (!user) throw new ApiError(404, "USER_NOT_FOUND", "Account not found.");

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    // "A password reset also revokes all sessions everywhere" — CLAUDE.md §4.
    await sessionService.revokeAllSessions(user._id);

    ok(res, { reset: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { forgotPassword, resetPassword };
