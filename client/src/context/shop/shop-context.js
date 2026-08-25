import { createContext } from 'react';

export const ShopContext = createContext(null);

// Constants live here, not in ShopContext.jsx (same split as booking-context.js
// — mixing component + non-component exports breaks Fast Refresh).

export const SHIPPING_PER_SELLER = 350; // §3: flat Rs 350 per seller/parcel, once per distinct seller
export const COD_CAP = 20000; // §3: COD blocked when total exceeds this AND any seller in cart lacks COD support
export const CHECKOUT_SESSION_MINUTES = 10; // same soft-lock *visual* pattern as booking checkout (§6) — cosmetic only
export const SHIP_WITHIN_DAYS = 2; // "ship within" clock during packing (§6 fulfilment)
export const RETURN_SHIPPING_FEE = 350; // §3: charged against the refund unless the fault is the seller's

// Same deterministic payment-outcome triggers as bookings — CLAUDE.md §3: "This
// exact machine is reused for both tour bookings and gear orders." Reusing the
// booking module's constants (rather than inventing a second set) means a
// traveller who already knows the test card/numbers from checkout doesn't have
// to learn new ones for gear.
export { DECLINE_CARD, FRAUD_CARD, FRAUD_AMOUNT_THRESHOLD, refFor } from '../booking/booking-context';

// Coupons — §3's five distinct failure modes plus `valid`, modelled as a
// `result` enum returned by applyCoupon(), never a bare boolean. `EXPIRED_`/
// `USED_COUPON` are deterministic magic values in the same documented spirit
// as the auth module's magic OTP (§7) — not hidden test hooks.
export const COUPONS = {
  TREK10: { type: 'pct', value: 10, minSubtotal: 5000, sellerId: null },
  GEAR500: { type: 'flat', value: 500, minSubtotal: 3000, sellerId: null },
  KARAKORAM15: { type: 'pct', value: 15, minSubtotal: 0, sellerId: 'karakoram-gear' },
};
export const EXPIRED_COUPON = 'SUMMER22';
export const USED_COUPON = 'WELCOME5';
export const USED_COUPON_ORDER_REF = 'ORD-2026-0714-3312';

export const RETURN_REASONS = [
  { id: 'size', label: 'Wrong size', sellerFault: false },
  { id: 'damaged', label: 'Arrived damaged', sellerFault: true },
  { id: 'wrong', label: 'Not as listed', sellerFault: true },
  { id: 'changed', label: 'Changed my mind', sellerFault: false },
];

export const FULFILMENT_STEPS = ['packing', 'shipped', 'delivered'];

// The seller identity this demo account acts as when wearing the `seller`
// role — CLAUDE.md's "one demo account, every actor" pattern (§7) has no
// existing concept of a per-account seller identity anywhere (unlike vendor/
// transport/property, which are single-entity by construction already), so
// this fixes it to one of the three seed SELLERS rather than inventing real
// multi-seller-account switching that nothing else in the app supports yet.
export const DEMO_SELLER_ID = 'karakoram-gear';
