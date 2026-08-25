import { createContext } from 'react';

export const TransportContext = createContext(null);

// Shared lead lifecycle (CLAUDE.md §3 "Lead / quote lifecycle") — the same
// shape serves transport quotes AND property/restaurant/group enquiries:
//   request → quoted (owner sets a required expiry: 24h/48h/7 days)
//   quoted  → accepted (a real booking is created — out of scope this pass,
//             see the module 05 build-order note) | expired | withdrawn
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

// §6 permits gate formula, reused for the vehicle's own search-visibility.
export function vehicleVisible(vehicle, permits, ownerKycApproved) {
  if (!vehicle.active) return false;
  if (!ownerKycApproved) return false;
  if (!vehicle.needsPermit) return true;
  const permit = permits.find((p) => p.id === vehicle.permitId);
  if (!permit) return false;
  return daysLeftStatus(permit.daysLeft).label !== 'Expired';
}

export const SEED_VEHICLES = [
  { id: 'v1', name: 'Toyota Land Cruiser', type: 'Jeep · 4×4', capacity: 6, active: true, needsPermit: true, permitId: 'p1' },
  { id: 'v2', name: 'Hiace Grand', type: 'Van · 12-seat', capacity: 12, active: true, needsPermit: true, permitId: 'p2' },
  { id: 'v3', name: 'Honda Civic', type: 'Sedan · 4-seat', capacity: 4, active: false, needsPermit: false, permitId: null },
];

export const SEED_PERMITS = [
  { id: 'p1', vehicleId: 'v1', number: 'GB-DNP-2026-0881', region: 'Gilgit-Baltistan', daysLeft: 210 },
  { id: 'p2', vehicleId: 'v2', number: 'GB-KKH-2026-0433', region: 'Gilgit-Baltistan', daysLeft: 18 },
];

export const SEED_ROUTES = [
  { id: 'r1', vehicleId: 'v1', from: 'Gilgit', to: 'Hunza', fareMode: 'whole', wholeFare: 12000, seatFare: null, minSeats: null },
  { id: 'r2', vehicleId: 'v2', from: 'Islamabad', to: 'Naran', fareMode: 'seat', wholeFare: null, seatFare: 3500, minSeats: 6 },
];

export const SEED_ROOMS = [
  { id: 'rm1', name: 'Valley-facing double', capacity: 2, nightlyRate: 14500, total: 4, booked: 2 },
  { id: 'rm2', name: 'Twin with shared bath', capacity: 2, nightlyRate: 8900, total: 6, booked: 1 },
  { id: 'rm3', name: 'Family suite', capacity: 4, nightlyRate: 22000, total: 2, booked: 2 },
];

export const SEED_MENU = [
  { id: 'mn1', name: 'Chapshuro', price: 650, on: true },
  { id: 'mn2', name: 'Hunza walnut cake', price: 450, on: true },
  { id: 'mn3', name: 'Daal chawal', price: 550, on: true },
  { id: 'mn4', name: 'Yak karahi (order by 4pm)', price: 2200, on: false },
];

// Seeded so Quotes/Enquiries aren't empty on first load — a real deployment
// has these arrive from the traveller-facing enquiry screens instead.
export const SEED_LEADS = [
  {
    id: 'ld1', kind: 'transport', subjectId: 'v1', subjectLabel: 'Toyota Land Cruiser · Gilgit → Hunza',
    name: 'Omar Farooq', date: '2026-09-12', count: 4, note: 'Pickup from Gilgit airport if possible.',
    status: 'request', createdAt: Date.now() - 3600000, deadlineAt: Date.now() + 20 * 3600000, quote: null,
  },
  {
    id: 'ld2', kind: 'transport', subjectId: 'v2', subjectLabel: 'Hiace Grand · Islamabad → Naran',
    name: 'Fatima Noor', date: '2026-09-20', count: 8, note: '',
    status: 'quoted', createdAt: Date.now() - 7200000, deadlineAt: Date.now() + 16 * 3600000,
    quote: { lineItems: [{ label: 'Vehicle fare', amount: 28000 }, { label: 'Driver overnight', amount: 3000 }], total: 31000, expiryHours: 48, quotedAt: Date.now() - 1800000, expiresAt: Date.now() + 46.5 * 3600000 },
  },
  {
    id: 'ld3', kind: 'table', subjectId: null, subjectLabel: 'Dinner table enquiry',
    name: 'Hassan Raza', date: '2026-09-05', count: 2, note: 'Anniversary dinner, quiet table if possible.',
    status: 'request', createdAt: Date.now() - 5400000, deadlineAt: Date.now() + 18.5 * 3600000, quote: null,
  },
  {
    id: 'ld4', kind: 'group', subjectId: null, subjectLabel: 'Group dinner enquiry',
    name: 'Ayesha Malik', date: '2026-09-08', count: 14, note: 'Corporate retreat, need one long table.',
    status: 'request', createdAt: Date.now() - 1800000, deadlineAt: Date.now() + 23.5 * 3600000, quote: null,
  },
];
