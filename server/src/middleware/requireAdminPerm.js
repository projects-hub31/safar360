const ApiError = require("../utils/ApiError");

// Exact permission matrix, CLAUDE.md §3 "Admin RBAC" — mirrors the client's
// own `perms(adminRole)` (context/admin/admin-context.js) so the two can
// never silently drift. Enforced by absence (§3): a denied route 403s, the
// same as a hidden nav item never rendering — never a "here but disabled"
// response.
const MATRIX = {
  kyc: ["super", "sub"],
  moderation: ["super", "sub"],
  finance: ["super", "finance"],
  disputes: ["super", "finance"],
  fraud: ["super", "finance"],
  analytics: ["super", "sub", "finance"],
  config: ["super"],
  audit: ["super", "finance"],
};

// Mount after requireAuth AND requireRole('admin') — this only refines
// *which* admin sub-role may act, it doesn't check role==='admin' itself.
function requireAdminPerm(permKey) {
  const allowed = MATRIX[permKey];
  return function (req, res, next) {
    if (!req.user) return next(new ApiError(401, "UNAUTHENTICATED", "Sign in to continue."));
    if (!allowed.includes(req.user.adminRole)) {
      return next(new ApiError(403, "FORBIDDEN", "You don't have access to this."));
    }
    return next();
  };
}

module.exports = requireAdminPerm;
