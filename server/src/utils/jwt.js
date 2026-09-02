const jwt = require("jsonwebtoken");
const env = require("../config/env");

const ACCESS_TTL = "15m";
const REFRESH_TTL = "30d";

function signAccessToken({ id, role, adminRole }) {
  return jwt.sign({ sub: String(id), role, adminRole: adminRole || undefined }, env.jwtSecret, {
    expiresIn: ACCESS_TTL,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

// Refresh tokens carry `jti`/`family` (rotation-theft detection, CLAUDE.md
// §4) — the actual session record lives in the Session model; this token is
// only proof of possession of a given jti.
function signRefreshToken({ id, family, jti }) {
  return jwt.sign({ sub: String(id), family, jti }, env.jwtRefreshSecret, {
    expiresIn: REFRESH_TTL,
  });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

module.exports = {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  REFRESH_TTL_MS,
};
