// Vendor subscription plans, CLAUDE.md §3 "Commission is plan-driven, not a
// single global rate". `listingCap: null` means unlimited (Pro).
const VENDOR_PLANS = {
  Starter: { pricePerMonth: 2500, listingCap: 3, commissionPct: 15 },
  Growth: { pricePerMonth: 6500, listingCap: 15, commissionPct: 12 },
  Pro: { pricePerMonth: 14000, listingCap: null, commissionPct: 9 },
};

module.exports = { VENDOR_PLANS };
