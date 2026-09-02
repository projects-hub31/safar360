const ApiError = require("../utils/ApiError");

// Server-side twin of the client's RequireRole guard (CLAUDE.md §8 item 11).
// Mount after requireAuth. A denied route throws — it never silently
// downgrades to a partial/disabled response.
function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.user) {
      return next(new ApiError(401, "UNAUTHENTICATED", "Sign in to continue."));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "FORBIDDEN", "You don't have access to this."));
    }
    return next();
  };
}

module.exports = requireRole;
