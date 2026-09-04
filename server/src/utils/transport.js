// Mirrors client/src/context/transport/transport-context.js's pure helpers
// exactly (CLAUDE.md §4: "the same rule lives on both sides") — season
// pricing and the permit days-left/warning/expired formula.
const PERMIT_WARNING_DAYS = 30;
const SEASON_MULTIPLIERS = { peak: 1.4, shoulder: 1.0, winter: 0.6 };

function seasonFor(dateStr) {
  const month = dateStr ? new Date(dateStr).getMonth() + 1 : new Date().getMonth() + 1;
  if ([6, 7, 8].includes(month)) return "peak";
  if ([12, 1, 2].includes(month)) return "winter";
  return "shoulder";
}

function roomRate(nightlyRate, checkIn) {
  return Math.round(nightlyRate * SEASON_MULTIPLIERS[seasonFor(checkIn)]);
}

function daysLeft(expiresAt) {
  return Math.ceil((expiresAt.getTime() - Date.now()) / 86400000);
}

function permitStatusLabel(days) {
  if (days < 0) return "expired";
  if (days <= PERMIT_WARNING_DAYS) return "expiring";
  return "valid";
}

module.exports = { PERMIT_WARNING_DAYS, SEASON_MULTIPLIERS, seasonFor, roomRate, daysLeft, permitStatusLabel };
