const ApiError = require("../utils/ApiError");

// Per-phone-number sign-in throttle, CLAUDE.md §4: "Failed sign-ins are
// rate-limited per phone number, with the limit disclosed up front." In-memory
// is a deliberate, documented stand-in for Redis (same call as the soft-lock
// service, §9 day-1 decision) — fine for a single-process dev/staging
// deployment, not for a horizontally-scaled one.
const buckets = new Map();

function createRateLimiter({ max, windowMs, keyFn, message }) {
  return function (req, res, next) {
    const key = keyFn(req);
    if (!key) return next();

    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now > bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (bucket.count >= max) {
      const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
      res.set("Retry-After", String(retryAfterSec));
      return next(
        new ApiError(
          429,
          "RATE_LIMITED",
          message || `Too many attempts. Limit is ${max} per ${Math.round(windowMs / 60000)} minutes — try again in ${retryAfterSec}s.`
        )
      );
    }

    bucket.count += 1;
    return next();
  };
}

const loginLimiter = createRateLimiter({
  max: 5,
  windowMs: 15 * 60 * 1000,
  keyFn: (req) => req.body && (req.body.identifier || req.body.phone),
  message: "Too many sign-in attempts for this phone number. Limit is 5 per 15 minutes — try again shortly.",
});

module.exports = { createRateLimiter, loginLimiter };
