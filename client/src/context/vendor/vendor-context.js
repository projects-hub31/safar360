import { createContext } from 'react';

export const VendorContext = createContext(null);

// Vendor subscription — full legal graph (CLAUDE.md §3):
//   active    → past_due (charge fails) | cancelled (vendor cancels)
//   past_due  → active (retry succeeds) | grace (retries exhausted)
//   grace     → active (payment received) | suspended (3 days elapse)
//   suspended → active (payment received) | cancelled (90 days elapse)
//   cancelled → active (resubscribe) | purged (90 days elapse)
export const GRACE_DAYS = 3;
export const SALES_TAX_PCT = 16;

export const PLANS = [
  { id: 'starter', name: 'Starter', price: 2500, listingCap: 3, commissionPct: 15 },
  { id: 'growth', name: 'Growth', price: 6500, listingCap: 15, commissionPct: 12 },
  { id: 'pro', name: 'Pro', price: 14000, listingCap: Infinity, commissionPct: 9 },
];

export const DECLINE_REASONS = [
  { id: 'guides', label: 'No guide available that week' },
  { id: 'weather', label: 'Weather or road conditions' },
  { id: 'minimum', label: 'Below my minimum group size' },
  { id: 'permits', label: "Permits won't clear in time" },
];

// Seeded demo payout ledger (same row shape as the platform ledger, §3) —
// kept permanently, even now that VendorContext talks to the real backend
// (below), because AdminContext's fraud/dispute demo resolutions and
// AiContext's weather-cancel demo both call `reverseLedger` against these
// exact fixed ids (LG-4002/LG-4003/LG-4004) — the same "legacy seed" pattern
// BookingContext's own LEGACY_SEED_REFS uses for its two seeded demo
// bookings, for the same reason: real per-vendor ledger data starts empty
// for a freshly-registered vendor, and these cross-module demos need
// something durable to point at regardless. `reverseLedger` below checks
// this set and mutates these rows locally instead of hitting the API.
export const SEED_LEDGER = [
  { id: 'LG-4001', kind: 'commission', ref: 'SFR-2026-0801-2210', label: 'Hunza & Attabad Lake · 2 seats', gross: 113250, rate: 0.12, commission: 13590, net: 99660, state: 'released' },
  { id: 'LG-4002', kind: 'commission', ref: 'SFR-2026-0809-8871', label: 'Hunza & Attabad Lake · 4 seats', gross: 226500, rate: 0.12, commission: 27180, net: 199320, state: 'pending' },
  { id: 'LG-4003', kind: 'commission', ref: 'SFR-2026-0814-5521', label: 'Karakoram Highway · 3 seats', gross: 217200, rate: 0.12, commission: 26064, net: 191136, state: 'accruing' },
  { id: 'LG-4004', kind: 'commission', ref: 'SFR-2026-0730-1187', label: 'Hunza & Attabad Lake · 2 seats', gross: 113250, rate: 0.12, commission: 13590, net: 99660, state: 'reversed' },
];

export const LEGACY_SEED_LEDGER_IDS = new Set(SEED_LEDGER.map((r) => r.id));

// Client plan ids (lowercase, used throughout the UI/routing) <-> the real
// server's VENDOR_PLANS keys (server/src/utils/vendorPlans.js, capitalized).
// Two small maps rather than changing either side's own natural casing.
export const PLAN_ID_TO_SERVER = { starter: 'Starter', growth: 'Growth', pro: 'Pro' };
export const SERVER_PLAN_TO_ID = { Starter: 'starter', Growth: 'growth', Pro: 'pro' };
