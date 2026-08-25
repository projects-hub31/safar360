import { createContext } from 'react';

export const BookingContext = createContext(null);

// Constants live here (not in BookingContext.jsx) so that file can export only
// the provider component — mixing component + non-component exports breaks
// Fast Refresh (same reason auth-context.js exists separately from
// AuthContext.jsx).

export const LOCK_MINUTES = 10; // §3 booking soft-lock
export const REQUEST_WINDOW_HOURS = 24; // §3 request-to-book response window
export const GROUP_WINDOW_HOURS = 24; // §3 group-split all-or-nothing window
export const SERVICE_FEE_PCT = 0.04;

export const PROMO_CODES = { NORTH10: 10 }; // §6 checkout: 10% off

// Deterministic payment-outcome triggers, same spirit as the auth module's
// magic OTP/duplicate-phone values — documented, not hidden. Chosen to be
// recognizable: real Stripe test-card numbers a developer would already know,
// rather than arbitrary strings.
export const DECLINE_CARD = '4000000000000002'; // Stripe's standard "generic decline"
export const FRAUD_CARD = '4100000000000019'; // Stripe's standard "elevated risk" card
export const FRAUD_AMOUNT_THRESHOLD = 400000; // large first-time transactions get held, §3 fraud review

export function refFor(prefix) {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const n = String(Math.floor(Math.random() * 9000) + 1000);
  return `${prefix}-${y}-${m}${day}-${n}`;
}
