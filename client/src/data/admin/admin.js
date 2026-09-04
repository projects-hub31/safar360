// Seed data for module 09 (admin console). Most of this module is real now
// (KYC operator rows, ledger, fraud, disputes, payout batches, config,
// audit — see CLAUDE.md's module 09 build notes) — what's left here is only
// what genuinely has no real backend to replace it: `KYC_QUEUE`'s
// transport/property/seller rows (real KYC review only covers `operator`)
// and `PLATFORM_LEDGER_EXTRA`'s referral rows (no referral backend exists
// yet, and `social/Referrals.jsx` reads these same rows directly per
// CLAUDE.md §6's "same shared ledger rows" requirement).

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

// transport/property/seller stay seeded permanently — real KYC document
// review (server/src/services/kyc.service.js) only covers `operator`, whose
// rows now come from the real GET /api/vendor/kyc/documents/queue and merge
// in over these (AdminContext.jsx's fetchKycQueue).
export const KYC_QUEUE = [
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
    id: 'kyc-6', vendorName: 'Swift Wheels Rentals', vendorType: 'transport', region: 'Sindh',
    cnic: '42101-9983271-0', submittedAt: Date.now() - 150 * 3600000, status: 'rejected', documents: kycDocs('transport'),
    decidedAt: Date.now() - 140 * 3600000, decidedBy: 'You', reasonId: 'expired', reasonLabel: 'Document expired',
  },
];

// --- Platform ledger (§3 Ledger — 6 states, one shared row shape) ----------
// Real commission/payout rows now come from GET /api/admin/ledger (every
// vendor booking that's actually happened in this environment) — these
// referral rows stay seeded permanently since no referral backend exists
// yet (CLAUDE.md §9 days 12-13, not built), and `social/Referrals.jsx`
// reads this exact array too, so the two surfaces can never disagree.
export const PLATFORM_LEDGER_EXTRA = [
  { id: 'plr-3', kind: 'referral', ref: 'SFR-2026-0805-3321', party: 'Amna Sheikh', label: 'Referral — Skardu & Deosai booking', gross: 156900, rate: 0.04, commission: 6276, net: 6276, state: 'pending' },
  { id: 'plr-4', kind: 'referral', ref: 'SFR-2026-0718-9903', party: 'Bilal Yousaf', label: 'Referral — Hunza & Attabad Lake booking', gross: 113250, rate: 0.04, commission: 4530, net: 4530, state: 'released' },
  { id: 'plr-7', kind: 'referral', ref: 'SFR-2026-0821-7734', party: 'Amna Sheikh', label: 'Referral — Naltar Valley Ski Weekend booking', gross: 45000, rate: 0.04, commission: 1800, net: 1800, state: 'accruing' },
  { id: 'plr-8', kind: 'referral', ref: 'SFR-2026-0710-1182', party: 'Amna Sheikh', label: 'Referral — Fairy Meadows Trek booking', gross: 68000, rate: 0.04, commission: 2720, net: 2720, state: 'released' },
];

// --- Policy object (§3 Policy — admin-configurable, #/admin/config) --------
// Slider metadata only — the actual values are real now (GET/PATCH
// /api/admin/config), never a hardcoded default object.
export const POLICY_FIELDS = [
  { key: 'commissionPct', label: 'Default commission', min: 5, max: 25, step: 1, unit: '%', hint: 'Fallback only — vendor/seller plans carry their own rate.' },
  { key: 'referralPct', label: 'Referral commission', min: 1, max: 12, step: 1, unit: '%', hint: 'What an influencer earns on a conversion.' },
  { key: 'attributionDays', label: 'Attribution window', min: 1, max: 90, step: 1, unit: 'd', hint: 'How long a referral click stays credited.' },
  { key: 'cancelFreeHours', label: 'Free-cancellation window', min: 0, max: 96, step: 6, unit: 'h', hint: 'Used by the flexible cancellation-policy preset.' },
  { key: 'fraudThreshold', label: 'Fraud hold threshold', min: 0.5, max: 0.95, step: 0.01, unit: '', hint: 'Payments scoring above this are held for review.' },
  { key: 'weatherDecisionHours', label: 'Weather decision window', min: 2, max: 24, step: 1, unit: 'h', hint: 'Operator\'s window to decide proceed/postpone/cancel.' },
  { key: 'weatherRefundPct', label: 'Weather refund rate', min: 50, max: 100, step: 5, unit: '%', hint: 'Refund rate on an operator-initiated weather cancellation.' },
];
