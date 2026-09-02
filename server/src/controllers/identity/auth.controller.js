const bcrypt = require("bcryptjs");
const User = require("../../models/User");
const ApiError = require("../../utils/ApiError");
const { ok } = require("../../utils/respond");
const { normalizePhone, isValidEmail } = require("../../utils/validators");
const { generateOtp, hashOtp, isDevBypass, OTP_TTL_MS, OTP_MAX_ATTEMPTS, OTP_LOCKOUT_MS } = require("../../utils/otp");
const { verifyRefreshToken } = require("../../utils/jwt");
const sessionService = require("../../services/session.service");
const env = require("../../config/env");

const SELF_REGISTERABLE_ROLES = ["traveller", "operator", "transport", "property", "seller", "influencer"];

function sendOtp(user, purpose) {
  const code = generateOtp();
  user.otp = { codeHash: hashOtp(code), purpose, expiresAt: new Date(Date.now() + OTP_TTL_MS), attempts: 0, lockedUntil: null };
  // No real SMS/email provider is wired up (out of scope for this pass) —
  // logging stands in for "sent". `devOtp` on the response lets manual/API
  // testing proceed without one; never present outside development.
  console.log(`[otp] ${purpose} code for ${user.phone || user.email}: ${code}`);
  return code;
}

async function register(req, res, next) {
  try {
    const { method, phone, email, password, name, role } = req.body;

    if (!password || password.length < 6) {
      throw new ApiError(400, "WEAK_PASSWORD", "Password must be at least 6 characters.");
    }
    if (!role || !SELF_REGISTERABLE_ROLES.includes(role)) {
      throw new ApiError(400, "INVALID_ROLE", "Choose a valid account type.");
    }

    const normalizedPhone = method === "phone" ? normalizePhone(phone) : undefined;
    const normalizedEmail = method === "email" ? String(email || "").toLowerCase().trim() : undefined;

    if (method === "phone" && !normalizedPhone) {
      throw new ApiError(400, "INVALID_PHONE", "Enter a valid phone number.");
    }
    if (method === "email" && !isValidEmail(normalizedEmail)) {
      throw new ApiError(400, "INVALID_EMAIL", "Enter a valid email address.");
    }

    const existing = await User.findOne(
      normalizedPhone ? { phone: normalizedPhone } : { email: normalizedEmail }
    );
    // Never confirm outright which field matched — same "can't be used to
    // enumerate accounts" stance as the client mock (CLAUDE.md §6 register).
    if (existing) {
      throw new ApiError(409, "DUPLICATE_ACCOUNT", "An account with these details may already exist. Try signing in instead.");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      role,
      name: name || null,
      phone: normalizedPhone,
      email: normalizedEmail,
      passwordHash,
      verified: false,
    });

    const code = sendOtp(user, "register");
    await user.save();

    ok(res, {
      userId: user._id,
      otpRequired: true,
      devOtp: env.nodeEnv !== "production" ? code : undefined,
    }, 201);
  } catch (err) {
    next(err);
  }
}

async function findByIdentifier(identifier) {
  const isEmail = String(identifier || "").includes("@");
  return isEmail
    ? User.findOne({ email: String(identifier).toLowerCase().trim() })
    : User.findOne({ phone: normalizePhone(identifier) });
}

async function login(req, res, next) {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      throw new ApiError(400, "MISSING_FIELDS", "Enter your phone/email and password.");
    }

    const user = await findByIdentifier(identifier);
    if (!user) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "Incorrect phone/email or password.");
    }
    if (!user.verified) {
      throw new ApiError(403, "NOT_VERIFIED", "Verify your phone/email before signing in.");
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "Incorrect phone/email or password.");
    }

    const { accessToken, refreshToken } = await sessionService.issueSession(user);
    res.cookie("s360_rt", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    ok(res, { user: user.toSafeJSON(), accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const { userId, code, purpose } = req.body;
    if (!userId || !code || !purpose) {
      throw new ApiError(400, "MISSING_FIELDS", "Missing verification details.");
    }

    const user = await User.findById(userId);
    if (!user || !user.otp || user.otp.purpose !== purpose) {
      throw new ApiError(400, "OTP_NOT_FOUND", "No verification in progress. Start again.");
    }

    if (user.otp.lockedUntil && user.otp.lockedUntil.getTime() > Date.now()) {
      const minsLeft = Math.ceil((user.otp.lockedUntil.getTime() - Date.now()) / 60000);
      throw new ApiError(429, "OTP_LOCKED", `Too many wrong codes. Try again in ${minsLeft} minute(s), or resend a new code by email.`);
    }

    if (user.otp.expiresAt.getTime() < Date.now()) {
      throw new ApiError(400, "OTP_EXPIRED", "This code expired. Request a new one.");
    }

    const bypass = isDevBypass(code);
    const matches = bypass || hashOtp(code) === user.otp.codeHash;

    if (!matches) {
      user.otp.attempts += 1;
      const exhausted = user.otp.attempts >= OTP_MAX_ATTEMPTS;
      if (exhausted) {
        user.otp.lockedUntil = new Date(Date.now() + OTP_LOCKOUT_MS);
        await user.save();
        throw new ApiError(429, "OTP_EXHAUSTED", "Too many wrong codes. Locked for 15 minutes — verify by email instead.");
      }
      await user.save();
      throw new ApiError(400, "OTP_INVALID", `Wrong code. ${OTP_MAX_ATTEMPTS - user.otp.attempts} attempt(s) left.`);
    }

    user.otp = undefined;
    if (purpose === "register") user.verified = true;
    await user.save();

    if (purpose === "reset") {
      // Reset flow's second step (set a new password) happens via
      // POST /api/identity/password/reset, gated on this short-lived token —
      // never issue a full session off an OTP alone for a reset.
      const jwt = require("jsonwebtoken");
      const resetToken = jwt.sign({ sub: String(user._id), purpose: "reset" }, env.jwtSecret, { expiresIn: "15m" });
      return ok(res, { resetToken });
    }

    const { accessToken, refreshToken } = await sessionService.issueSession(user);
    res.cookie("s360_rt", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    ok(res, { user: user.toSafeJSON(), accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
}

async function resendOtp(req, res, next) {
  try {
    const { userId, purpose } = req.body;
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "USER_NOT_FOUND", "Account not found.");

    if (user.otp && user.otp.lockedUntil && user.otp.lockedUntil.getTime() > Date.now()) {
      const minsLeft = Math.ceil((user.otp.lockedUntil.getTime() - Date.now()) / 60000);
      throw new ApiError(429, "OTP_LOCKED", `Too many wrong codes. Try again in ${minsLeft} minute(s).`);
    }

    const code = sendOtp(user, purpose || "register");
    await user.save();
    ok(res, { sent: true, devOtp: env.nodeEnv !== "production" ? code : undefined });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies?.s360_rt || req.body?.refreshToken;
    if (!token) throw new ApiError(401, "NO_REFRESH_TOKEN", "Sign in again.");

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new ApiError(401, "SESSION_INVALID", "Session expired. Sign in again.");
    }

    const user = await User.findById(payload.sub);
    if (!user) throw new ApiError(401, "SESSION_INVALID", "Session expired. Sign in again.");

    const { accessToken, refreshToken } = await sessionService.rotateSession(
      { userId: payload.sub, family: payload.family, jti: payload.jti },
      user
    );

    res.cookie("s360_rt", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    ok(res, { accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const token = req.cookies?.s360_rt || req.body?.refreshToken;
    if (token) {
      try {
        const payload = verifyRefreshToken(token);
        await sessionService.revokeSessionByJti(payload.jti);
      } catch {
        /* already invalid/expired — nothing to revoke */
      }
    }
    res.clearCookie("s360_rt");
    ok(res, { signedOut: true });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) throw new ApiError(404, "USER_NOT_FOUND", "Account not found.");
    ok(res, user.toSafeJSON());
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, verifyOtp, resendOtp, refresh, logout, me };
