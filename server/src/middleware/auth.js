const ApiError = require("../utils/ApiError");
const { verifyAccessToken } = require("../utils/jwt");

// The real security control behind the client's RequireAuth guard (CLAUDE.md
// §2 Law: "the UI gate is never the security control"). Every protected
// route mounts this before its handler.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return next(new ApiError(401, "UNAUTHENTICATED", "Sign in to continue."));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role, adminRole: payload.adminRole };
    return next();
  } catch {
    return next(new ApiError(401, "UNAUTHENTICATED", "Your session has expired. Sign in again."));
  }
}

module.exports = requireAuth;
