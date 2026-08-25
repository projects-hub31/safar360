import { createContext } from 'react';

export const AuthContext = createContext(null);

// Roles that require KYC before they can publish/take bookings (§3 KYC).
// Traveller and influencer skip straight to a verified account. Constants
// below live here (not in AuthContext.jsx) because that file exports a
// component, and mixing component + non-component exports breaks Fast
// Refresh.
export const PARTNER_ROLES = ['operator', 'transport', 'property', 'seller'];

export const OTP_TTL_SECONDS = 300; // 5 min, per §2/§6

// Per-role identity + default nav (CLAUDE.md §5 "Per-role default nav"),
// shared by the role switcher and the layout's top nav so both read one
// definition. Routes outside the module currently being built still resolve
// (ComingSoon is the catch-all, §7 client conventions) — they're real
// addresses, not placeholders.
export const ROLES = [
  { id: 'traveller', label: 'Traveller', nav: [['Discover', '/discover/home'], ['Bookings', '/booking/history'], ['Trips', '/ai/planner'], ['Feed', '/social/feed'], ['Gear', '/shop/catalog']] },
  { id: 'operator', label: 'Tour operator', nav: [['Dashboard', '/vendor/dashboard'], ['Listings', '/vendor/listings'], ['Bookings', '/vendor/inbox'], ['Money', '/vendor/payouts'], ['Plan', '/vendor/plans']] },
  { id: 'transport', label: 'Transport owner', nav: [['Vehicles', '/transport/vehicles'], ['Quotes', '/transport/quotes'], ['Permits', '/transport/permits'], ['Money', '/vendor/payouts']] },
  { id: 'property', label: 'Property owner', nav: [['Property', '/transport/property'], ['Rooms', '/transport/rooms'], ['Menu', '/transport/menu'], ['Enquiries', '/transport/enquiries']] },
  { id: 'seller', label: 'Gear seller', nav: [['Products', '/shop/seller-products'], ['Orders', '/shop/fulfilment'], ['Returns', '/shop/returns'], ['Money', '/vendor/payouts']] },
  { id: 'influencer', label: 'Influencer', nav: [['Feed', '/social/feed'], ['Compose', '/social/composer'], ['Campaigns', '/social/campaigns'], ['Referrals', '/social/referrals']] },
  { id: 'admin', label: 'Admin', nav: [['Overview', '/admin/console'], ['KYC', '/admin/kyc'], ['Moderation', '/admin/moderation'], ['Finance', '/admin/ledger'], ['Disputes', '/admin/disputes'], ['Config', '/admin/config']] },
];
