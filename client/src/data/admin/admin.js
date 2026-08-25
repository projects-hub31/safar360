// Seed data for module 09 (admin console). The whole app is one demo account
// switching roles (AuthContext's switchRole/ROLES) — a single logged-in user
// can't produce a real multi-vendor KYC queue, a multi-payment fraud queue, or
// a multi-dispute inbox on its own. This file follows the exact pattern
// VendorContext.SEED_LEDGER already established for the same problem: seeded,
// realistic, multi-actor rows rather than derived-from-one-user data. Where a
// row genuinely can link to something real elsewhere in the app (this
// session's own vendor ledger, a real social report), it does — see the
// `linkedLedgerId` / `linkedPostId` fields below and CLAUDE.md's module 09
// build note for which rows those are.

// --- KYC queue (§3 KYC, §6 09/kyc) -----------------------------------------
// Fixed 4 rejection reasons — resubmission is scoped per rejected document,
// not a full re-upload, and the reason is shown to the vendor verbatim.
export const KYC_REJECT_REASONS = [
  { id: 'unreadable', label: 'Image unreadable' },
  { id: 'expired', label: 'Document expired' },
  { id: 'mismatch', label: 'Name mismatch' },
  { id: 'missing', label: 'Missing document' },
];

// Required document set varies by vendor type (§3).
const DOC_SETS = {
  operator: ['CNIC (front)', 'CNIC (back)', 'Business registration'],
  transport: ['CNIC (front)', 'CNIC (back)', 'Route permit', 'Fitness certificate'],
  property: ['CNIC (front)', 'CNIC (back)', 'Business registration'],
  seller: ['CNIC (front)', 'CNIC (back)', 'Business registration'],
};

function kycDocs(type) {
  return DOC_SETS[type].map((name, i) => ({ id: `d${i}`, name, status: 'uploaded-in-review' }));
}

export const KYC_QUEUE = [
  {
    id: 'kyc-1', vendorName: 'Baltoro Adventures', vendorType: 'operator', region: 'Gilgit-Baltistan',
    cnic: '35202-4471829-6', submittedAt: Date.now() - 6 * 3600000, status: 'pending', documents: kycDocs('operator'),
  },
  {
    id: 'kyc-2', vendorName: 'Highland Movers', vendorType: 'transport', region: 'KPK',
    cnic: '17301-5528310-2', submittedAt: Date.now() - 19 * 3600000, status: 'pending', documents: kycDocs('transport'),
  },
  {
    id: 'kyc-3', vendorName: 'Lake View Guesthouse', vendorType: 'property', region: 'Gilgit-Baltistan',
    cnic: '61101-3390214-9', submittedAt: Date.now() - 22.5 * 3600000, status: 'pending', documents: kycDocs('property'),
  },
  {
    id: 'kyc-4', vendorName: 'Karakoram Gear Co.', vendorType: 'seller', region: 'Punjab',
    cnic: '35201-7784102-3', submittedAt: Date.now() - 3 * 3600000, status: 'pending', documents: kycDocs('seller'),
  },
  {
    id: 'kyc-5', vendorName: 'Neelum Trails', vendorType: 'operator', region: 'AJK',
    cnic: '82101-2201938-4', submittedAt: Date.now() - 96 * 3600000, status: 'approved', documents: kycDocs('operator'),
    decidedAt: Date.now() - 80 * 3600000, decidedBy: 'You',
  },
  {
    id: 'kyc-6', vendorName: 'Swift Wheels Rentals', vendorType: 'transport', region: 'Sindh',
    cnic: '42101-9983271-0', submittedAt: Date.now() - 150 * 3600000, status: 'rejected', documents: kycDocs('transport'),
    decidedAt: Date.now() - 140 * 3600000, decidedBy: 'You', reasonId: 'expired', reasonLabel: 'Document expired',
  },
];

// --- Fraud review (§3 Fraud review — explainable rule breakdown) -----------
// Score is a sum of weighted, signed factors — never a bare number. `linkedLedgerId`
// ties exactly one row to a real VendorContext ledger row so a Refund action
// here can genuinely call reverseLedger and be visible on the vendor's own
// Payouts screen — every other row is a self-contained seeded mutation.
export const FRAUD_QUEUE = [
  {
    id: 'fr-1', bookingRef: 'SFR-2026-0809-8871', traveller: 'M. Aslam', amount: 226500,
    submittedAt: Date.now() - 40 * 60000, status: 'held', linkedLedgerId: 'LG-4002',
    factors: [
      { label: 'Card issued outside Pakistan', weight: 0.28 },
      { label: 'First booking on this account', weight: 0.24 },
      { label: 'Amount in top 5% of bookings', weight: 0.19 },
      { label: 'Departure within 72h', weight: 0.11 },
      { label: 'Previous chargeback on file', weight: 0.11 },
      { label: 'Device seen before with no chargebacks', weight: -0.14 },
    ],
  },
  {
    id: 'fr-2', bookingRef: 'SFR-2026-0822-4410', traveller: 'Zara Baig', amount: 68000,
    submittedAt: Date.now() - 3 * 3600000, status: 'held', linkedLedgerId: null,
    // Deliberately borderline (just under the 0.75 default) — dragging
    // Config's fraudThreshold slider a little lower visibly flips this row,
    // which fr-1 (well above) and fr-3 (well below) don't demonstrate.
    factors: [
      { label: 'Card issued outside Pakistan', weight: 0.28 },
      { label: 'First booking on this account', weight: 0.24 },
      { label: 'Amount in top 5% of bookings', weight: 0.19 },
      { label: 'IP geolocation mismatch', weight: 0.15 },
      { label: 'Device seen before with no chargebacks', weight: -0.14 },
    ],
  },
  {
    id: 'fr-3', bookingRef: 'SFR-2026-0715-2290', traveller: 'Hamza Iqbal', amount: 312000,
    submittedAt: Date.now() - 200 * 3600000, status: 'cleared', linkedLedgerId: null,
    resolvedAt: Date.now() - 195 * 3600000, resolvedBy: 'You',
    factors: [
      { label: 'Card issued outside Pakistan', weight: 0.28 },
      { label: 'Amount in top 5% of bookings', weight: 0.19 },
      { label: 'Account is 2 years old, no disputes', weight: -0.22 },
      { label: 'Device seen before with no chargebacks', weight: -0.14 },
    ],
  },
];

export const fraudScore = (row) => Math.round(row.factors.reduce((n, f) => n + f.weight, 0) * 100) / 100;

// --- Disputes (§3 Dispute resolution) --------------------------------------
// A cross-module timeline read from other modules' events, not a dispute-
// owned evidence copy. D-1 links to the same real vendor ledger row as
// fr-1's booking so a "release to operator" resolution stays consistent with
// what the vendor's own payouts screen shows.
export const DISPUTES = [
  {
    id: 'dp-1', bookingRef: 'SFR-2026-0809-8871', traveller: 'M. Aslam', operator: 'Karakoram Expeditions',
    amount: 226500, filedAt: Date.now() - 30 * 3600000, status: 'open', linkedLedgerId: 'LG-4002',
    travellerClaim: 'The operator never showed up at the pickup point — we waited two hours at Gilgit airport and had to arrange our own transport into Hunza.',
    operatorClaim: 'Our driver was on site on time; the group had already left with another vehicle before he arrived. We have a geofence check-in from our own vehicle at the pickup point.',
    timeline: [
      { label: 'Payment captured', at: Date.now() - 9 * 86400000, source: 'Payments' },
      { label: 'Geofence check-in — traveller device', at: null, source: 'AI & location' },
      { label: 'Weather alert issued for this route', at: null, source: 'AI & location' },
      { label: 'Operator marked trip complete', at: Date.now() - 2 * 86400000, source: 'Vendor' },
    ],
  },
  {
    id: 'dp-2', bookingRef: 'SFR-2026-0730-1187', traveller: 'Nida Chaudhry', operator: 'Karakoram Expeditions',
    amount: 113250, filedAt: Date.now() - 260 * 3600000, status: 'resolved', linkedLedgerId: 'LG-4004',
    travellerClaim: 'Route was rerouted mid-trip without notice due to a landslide; we missed two of the four promised stops.',
    operatorClaim: 'The reroute was a safety call flagged by the district authority — we offered a partial credit at the time, which was declined.',
    resolution: { type: 'split', amount: 45300, note: 'Route change was outside the operator\'s control but the trip fell materially short — 40% refunded, rest released to the operator.', decidedAt: Date.now() - 250 * 3600000, decidedBy: 'You' },
    timeline: [
      { label: 'Payment captured', at: Date.now() - 20 * 86400000, source: 'Payments' },
      { label: 'Geofence check-in — traveller device', at: Date.now() - 19 * 86400000, source: 'AI & location' },
      { label: 'Weather alert issued for this route', at: Date.now() - 18.5 * 86400000, source: 'AI & location' },
      { label: 'Operator marked trip complete', at: Date.now() - 17 * 86400000, source: 'Vendor' },
    ],
  },
];

// --- Payout batch (§3 Ledger — two-step approval) ---------------------------
// One candidate (pc-1) is this session's own live vendor's pending ledger row
// (LG-4002) — note it's ALSO the linked fraud/dispute row above, so approving
// a batch that includes it is deliberately blocked until fraud/dispute clear,
// same as the real rule ("a payee with an open dispute is held out of a
// payout batch entirely").
export const PAYOUT_CANDIDATES = [
  { id: 'pc-1', party: 'Karakoram Expeditions', kind: 'vendor', ledgerRowIds: ['LG-4002'], amount: 199320, hasOpenDispute: true },
  { id: 'pc-2', party: 'Baltistan Trails', kind: 'vendor', ledgerRowIds: ['plr-1'], amount: 84200, hasOpenDispute: false },
  { id: 'pc-3', party: 'Karakoram Gear Co.', kind: 'seller', ledgerRowIds: ['plr-2'], amount: 52360, hasOpenDispute: false },
  { id: 'pc-4', party: 'Amna Sheikh', kind: 'influencer', ledgerRowIds: ['plr-3'], amount: 18400, hasOpenDispute: false },
];

// A short, fixed roster of plausible other-admin names — used to demo the
// "preparer cannot also be approver, even same role" identity rule (§3) since
// there is no real multi-admin auth in this app.
export const ADMIN_ROSTER = ['Ayesha Raza', 'Usman Tariq', 'Sana Malik'];

// --- Platform ledger (§3 Ledger — 6 states, one shared row shape) ----------
// Extra rows beyond VendorContext's own single-vendor SEED_LEDGER — a real
// platform ledger spans many vendors/sellers/influencers, which one demo
// vendor's own context can't represent alone. The admin Ledger screen merges
// these with VendorContext.ledger's live rows (see AdminContext.jsx) so the
// one real vendor's numbers stay consistent between its own Payouts screen
// and this platform-wide view.
export const PLATFORM_LEDGER_EXTRA = [
  { id: 'plr-1', kind: 'commission', ref: 'SFR-2026-0803-6612', party: 'Baltistan Trails', label: 'Skardu & Deosai · 3 seats', gross: 156900, rate: 0.1, commission: 15690, net: 141210, state: 'pending' },
  { id: 'plr-2', kind: 'commission', ref: 'ORD-2026-0812-0091', party: 'Karakoram Gear Co.', label: 'Trekking pole set ×2, insulated jacket', gross: 43800, rate: 0.12, commission: 5256, net: 38544, state: 'accrued' },
  { id: 'plr-3', kind: 'referral', ref: 'SFR-2026-0805-3321', party: 'Amna Sheikh', label: 'Referral — Skardu & Deosai booking', gross: 156900, rate: 0.04, commission: 6276, net: 6276, state: 'pending' },
  { id: 'plr-4', kind: 'referral', ref: 'SFR-2026-0718-9903', party: 'Bilal Yousaf', label: 'Referral — Hunza & Attabad Lake booking', gross: 113250, rate: 0.04, commission: 4530, net: 4530, state: 'released' },
  { id: 'plr-5', kind: 'payout', ref: 'PB-2026-0801', party: 'Baltistan Trails', label: 'Payout batch PB-2026-0801', gross: 210500, rate: 0, commission: 0, net: 210500, state: 'released' },
  { id: 'plr-6', kind: 'commission', ref: 'SFR-2026-0809-8871', party: 'Karakoram Expeditions', label: 'Hunza & Attabad Lake · 4 seats — under dispute dp-1', gross: 226500, rate: 0.12, commission: 27180, net: 199320, state: 'held·dispute' },
];

// --- Policy object (§3 Policy — admin-configurable, #/admin/config) --------
export const DEFAULT_POLICY = {
  commissionPct: 12,
  referralPct: 4,
  attributionDays: 30,
  cancelFreeHours: 48,
  fraudThreshold: 0.75,
  weatherDecisionHours: 12,
  weatherRefundPct: 100,
  // Read-only context fields also on the object per §3, not admin-edited sliders:
  weatherAuthority: 'Pakistan Meteorological Department district advisory',
  weatherWindKmh: 60,
};

export const POLICY_FIELDS = [
  { key: 'commissionPct', label: 'Default commission', min: 5, max: 25, step: 1, unit: '%', hint: 'Fallback only — vendor/seller plans carry their own rate.' },
  { key: 'referralPct', label: 'Referral commission', min: 1, max: 12, step: 1, unit: '%', hint: 'What an influencer earns on a conversion.' },
  { key: 'attributionDays', label: 'Attribution window', min: 1, max: 90, step: 1, unit: 'd', hint: 'How long a referral click stays credited.' },
  { key: 'cancelFreeHours', label: 'Free-cancellation window', min: 0, max: 96, step: 6, unit: 'h', hint: 'Used by the flexible cancellation-policy preset.' },
  { key: 'fraudThreshold', label: 'Fraud hold threshold', min: 0.5, max: 0.95, step: 0.01, unit: '', hint: 'Payments scoring above this are held for review.' },
  { key: 'weatherDecisionHours', label: 'Weather decision window', min: 2, max: 24, step: 1, unit: 'h', hint: 'Operator\'s window to decide proceed/postpone/cancel.' },
  { key: 'weatherRefundPct', label: 'Weather refund rate', min: 50, max: 100, step: 5, unit: '%', hint: 'Refund rate on an operator-initiated weather cancellation.' },
];

// --- Audit log (§3 audit — one shared, append-only action log) -------------
// Seeded history so the screen isn't empty on first load; every admin action
// taken during a live session appends on top of this via AdminContext.logAction.
export const AUDIT_SEED = [
  { id: 'au-1', at: Date.now() - 240 * 3600000, actor: 'You', action: 'KYC approved', target: 'Neelum Trails', category: 'kyc', tone: 'success' },
  { id: 'au-2', at: Date.now() - 140 * 3600000, actor: 'You', action: 'KYC rejected — Document expired', target: 'Swift Wheels Rentals', category: 'kyc', tone: 'danger' },
  { id: 'au-3', at: Date.now() - 195 * 3600000, actor: 'You', action: 'Fraud review cleared', target: 'SFR-2026-0715-2290', category: 'money', tone: 'success' },
  { id: 'au-4', at: Date.now() - 250 * 3600000, actor: 'You', action: 'Dispute resolved — split', target: 'dp-2 · SFR-2026-0730-1187', category: 'moderation', tone: 'held' },
  { id: 'au-5', at: Date.now() - 300 * 3600000, actor: 'Ayesha Raza', action: 'Policy changed — fraudThreshold 0.7 → 0.75', target: 'Policy config', category: 'money', tone: 'warning' },
  { id: 'au-6', at: Date.now() - 40 * 3600000, actor: 'Usman Tariq', action: 'Payout batch approval refused — same identity as preparer', target: 'PB-draft-0825', category: 'money', tone: 'danger', refused: true },
];
