import { createContext } from 'react';

export const TransportContext = createContext(null);

// Shared lead lifecycle (CLAUDE.md §3 "Lead / quote lifecycle") — the same
// shape serves transport quotes AND property/restaurant/group enquiries,
// real end-to-end (server/src/controllers/transport/leads.controller.js):
//   request → quoted (owner sets a required expiry: 24h/48h/7 days)
//   quoted  → accepted (the Lead itself is the record — no second Booking
//             document) | expired (settled lazily on read) | withdrawn
//   request → declined (no reason required, unlike module 04's booking decline)
// No inventory hold and no payment at any step before `accepted`.
export const LEAD_WINDOW_HOURS = 24; // owner's "reply within" clock while a lead sits at `request`
export const QUOTE_EXPIRY_OPTIONS = [
  { hours: 24, label: '24 hours' },
  { hours: 48, label: '48 hours' },
  { hours: 168, label: '7 days' },
];

export const PERMIT_WARNING_DAYS = 30; // §3 permits — T-30 warning, T+0 withdrawal

// §6 featured: region-based pricing, 7–60 day slider (step 7).
export const FEATURED_REGIONS = [
  { region: 'Gilgit-Baltistan', perDay: 450 },
  { region: 'Khyber Pakhtunkhwa', perDay: 350 },
  { region: 'Azad Kashmir', perDay: 300 },
  { region: 'Balochistan', perDay: 250 },
];
export const FEATURED_MIN_DAYS = 7;
export const FEATURED_MAX_DAYS = 60;
export const FEATURED_STEP_DAYS = 7;
// Same "2 sponsored per 8 organic" rule as Discovery home's relevance sort
// (§6 discovery/home) — expressed here as the seeded count already sold this
// cycle, so the featured screen can show whether a new purchase queues.
export const SPONSORED_CAP_PER_10 = 2;
export const SEED_SPONSORED_SOLD = 1; // out of the cap, in the region this vendor would buy into

// §6 rooms: seasonal multipliers stack on the nightly rate, but the traveller
// only ever sees one final computed number (never a base+surcharge split).
export const SEASON_MULTIPLIERS = { peak: 1.4, shoulder: 1.0, winter: 0.6 };

// Jun–Aug and Dec–Feb read as peak/winter respectively for a Gilgit-Baltistan
// lodge; everything else is shoulder. A real deployment would key this off
// the property's own calendar, but the rule has to live somewhere so the
// "one final computed number" promise above is actually computed, not just
// asserted — see roomRate().
export function seasonFor(dateStr) {
  const month = dateStr ? new Date(dateStr).getMonth() + 1 : new Date().getMonth() + 1;
  if ([6, 7, 8].includes(month)) return 'peak';
  if ([12, 1, 2].includes(month)) return 'winter';
  return 'shoulder';
}
export function roomRate(nightlyRate, checkIn) {
  return Math.round(nightlyRate * SEASON_MULTIPLIERS[seasonFor(checkIn)]);
}

export function daysLeftStatus(daysLeft) {
  if (daysLeft < 0) return { label: 'Expired', tone: 'danger' };
  if (daysLeft <= PERMIT_WARNING_DAYS) return { label: 'Expiring', tone: 'warning' };
  return { label: 'Valid', tone: 'success' };
}

// §6 permits gate formula, reused for the vehicle's own search-visibility —
// a live client-side preview of what the real discover feed will show
// (server/src/controllers/discover/vehicles.controller.js is the actual
// enforcer). `ownerKycApproved` is real for a partner-role account (§9) but
// deliberately unreachable-'true' for `transport`/`property` in the caller
// today — real KYC review only covers `operator` so far, so requiring
// 'approved' here would hide every real vehicle; see the discover
// controller's own comment for the full reasoning.
export function vehicleVisible(vehicle, permits, ownerKycApproved) {
  if (!vehicle.active) return false;
  if (!ownerKycApproved) return false;
  if (!vehicle.needsPermit) return true;
  const permit = permits.find((p) => p.id === vehicle.permitId);
  if (!permit) return false;
  return daysLeftStatus(permit.daysLeft).label !== 'Expired';
}

