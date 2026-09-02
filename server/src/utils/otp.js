const crypto = require("crypto");
const env = require("../config/env");

const OTP_TTL_MS = 5 * 60 * 1000; // 5 min, CLAUDE.md §4
const OTP_MAX_ATTEMPTS = 5;
const OTP_LOCKOUT_MS = 15 * 60 * 1000; // 15 min

// Same magic code the client mock already documents (CLAUDE.md §6) — kept
// alive as a non-production bypass so manual/API testing works without a
// real SMS/email provider wired up. Never accepted when NODE_ENV=production.
const DEV_MAGIC_OTP = "419027";

function generateOtp() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

function hashOtp(code) {
  return crypto.createHash("sha256").update(`${code}:${env.jwtSecret}`).digest("hex");
}

function isDevBypass(code) {
  return env.nodeEnv !== "production" && code === DEV_MAGIC_OTP;
}

module.exports = {
  OTP_TTL_MS,
  OTP_MAX_ATTEMPTS,
  OTP_LOCKOUT_MS,
  DEV_MAGIC_OTP,
  generateOtp,
  hashOtp,
  isDevBypass,
};
