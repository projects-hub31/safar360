// Ports client/src/data/traveler/tours.js's CANCELLATION_TIERS/refundPct
// server-side verbatim (CLAUDE.md §4: "the same rule lives on both sides").
// The refund calculator reads each *listing's own* policy, never a global
// constant (§3 "per listing, not global").
const CANCELLATION_TIERS = {
  flexible: [{ hours: 24, pct: 100 }],
  standard: [
    { hours: 24 * 7, pct: 100 },
    { hours: 48, pct: 50 },
  ],
  strict: [{ hours: 24 * 14, pct: 50 }],
};

function refundPct(policy, hoursUntilDeparture) {
  const tiers = CANCELLATION_TIERS[policy] || CANCELLATION_TIERS.standard;
  const hit = tiers.find((t) => hoursUntilDeparture >= t.hours);
  return hit ? hit.pct : 0;
}

module.exports = { CANCELLATION_TIERS, refundPct };
