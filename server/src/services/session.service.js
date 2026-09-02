const crypto = require("crypto");
const Session = require("../models/Session");
const ApiError = require("../utils/ApiError");
const { signAccessToken, signRefreshToken, REFRESH_TTL_MS } = require("../utils/jwt");

// Issues a brand-new login: a fresh family id starts a fresh rotation chain.
async function issueSession(user) {
  const family = crypto.randomUUID();
  const jti = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

  await Session.create({ user: user._id, family, jti, expiresAt });

  return {
    accessToken: signAccessToken({ id: user._id, role: user.role, adminRole: user.adminRole }),
    refreshToken: signRefreshToken({ id: user._id, family, jti }),
  };
}

// CLAUDE.md §4: "a rotated refresh token presented twice is treated as
// theft — revoke every session on that account." `jti` identifies exactly
// one previously-issued refresh token; reusing one already marked `used`
// (or one that's been revoked) is the theft signal.
async function rotateSession({ userId, family, jti }, user) {
  const session = await Session.findOne({ jti });

  if (!session || String(session.user) !== String(userId) || session.family !== family) {
    throw new ApiError(401, "SESSION_INVALID", "Session not recognised. Sign in again.");
  }

  if (session.revoked || session.used) {
    await Session.updateMany({ family }, { revoked: true });
    throw new ApiError(
      401,
      "TOKEN_REUSE_DETECTED",
      "This session was already used elsewhere — every session on this account has been signed out for safety. Sign in again."
    );
  }

  session.used = true;
  await session.save();

  const newJti = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);
  await Session.create({ user: userId, family, jti: newJti, expiresAt });

  return {
    accessToken: signAccessToken({ id: userId, role: user.role, adminRole: user.adminRole }),
    refreshToken: signRefreshToken({ id: userId, family, jti: newJti }),
  };
}

async function revokeSessionByJti(jti) {
  await Session.updateOne({ jti }, { revoked: true });
}

// CLAUDE.md §4: "A password reset also revokes all sessions everywhere."
async function revokeAllSessions(userId) {
  await Session.updateMany({ user: userId }, { revoked: true });
}

module.exports = { issueSession, rotateSession, revokeSessionByJti, revokeAllSessions };
