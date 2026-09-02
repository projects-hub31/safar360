const Lock = require("../models/Lock");
const ApiError = require("../utils/ApiError");

const LOCK_MINUTES = 10; // CLAUDE.md §3 booking soft-lock

// Reserves a slot for LOCK_MINUTES *without deducting anything* (CLAUDE.md
// §3) — deduction only ever happens later, on a verified payment capture.
async function createLock({ tourId, departureId, departureDate, seats, userId, title, price, cancellationPolicy }) {
  const expiresAt = new Date(Date.now() + LOCK_MINUTES * 60000);
  return Lock.create({
    tour: tourId,
    departureId,
    departureDate,
    seats,
    user: userId,
    title,
    price,
    cancellationPolicy,
    expiresAt,
  });
}

// Mongo's TTL monitor sweeps expired docs on its own ~60s cycle — it is not
// instant, so every read re-checks `expiresAt` itself rather than trusting
// that an unexpired-looking doc is actually still live.
function isExpired(lock) {
  return !lock || lock.expiresAt.getTime() <= Date.now();
}

async function getLiveLock(lockId, userId) {
  const lock = await Lock.findById(lockId);
  if (!lock || (userId && String(lock.user) !== String(userId))) {
    throw new ApiError(404, "LOCK_NOT_FOUND", "This hold no longer exists.");
  }
  if (isExpired(lock)) {
    await Lock.deleteOne({ _id: lock._id });
    throw new ApiError(410, "LOCK_EXPIRED", "Your 10-minute hold expired. Start again from the tour page.");
  }
  return lock;
}

async function releaseLock(lockId) {
  await Lock.deleteOne({ _id: lockId });
}

module.exports = { LOCK_MINUTES, createLock, isExpired, getLiveLock, releaseLock };
