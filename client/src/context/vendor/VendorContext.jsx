import { useRef, useState } from 'react';
import { VendorContext } from './vendor-context';
import { GRACE_DAYS, SEED_LEDGER } from './vendor-context';

// Vendor-side state: subscription (the publish-gate half not covered by KYC),
// a vendor's own listings (create/edit/publish), and their payout ledger.
//
// Scope note: newly published listings live in THIS context's own `listings`
// array — they are deliberately NOT merged into the traveller-facing
// Discovery catalog (`TOURS` / BookingContext's `avail`) in this pass. Doing
// that properly needs per-listing departures feeding a shared catalog layer,
// which is a real, separate piece of work (tracked as a known gap, not
// silently skipped — see CLAUDE.md). What's real here: the full CRUD, the
// publish-gate check against the vendor's actual live KYC/subscription state,
// and the subscription state machine. The Inbox screen reads BookingContext's
// real, already-tested `requests` queue directly instead of anything seeded.
export function VendorProvider({ children }) {
  const [subscription, setSubscription] = useState({ state: null, plan: null, graceToken: 0 });
  const [listings, setListings] = useState([]);
  const [ledger, setLedger] = useState(SEED_LEDGER);
  const nextId = useRef(1);

  // --- subscription --------------------------------------------------
  const subscribe = (plan) => setSubscription((s) => ({ ...s, state: 'active', plan }));
  const cancelSubscription = () => setSubscription((s) => ({ ...s, state: 'cancelled' }));
  // No live recurring billing to actually fail a charge — these are the
  // same kind of honestly-labeled testing levers as the Awaiting screen's
  // force-outcome panel (module 02), not hidden magic.
  const simulateChargeFailure = () => setSubscription((s) => (s.state === 'active' ? { ...s, state: 'past_due' } : s));
  const retryCharge = () => setSubscription((s) => (s.state === 'past_due' || s.state === 'suspended' ? { ...s, state: 'active' } : s));
  const exhaustRetries = () => setSubscription((s) => (s.state === 'past_due' ? { ...s, state: 'grace', graceToken: s.graceToken + 1 } : s));
  const onGraceExpire = () => setSubscription((s) => (s.state === 'grace' ? { ...s, state: 'suspended' } : s));

  // --- listings --------------------------------------------------------
  const genId = () => `v${nextId.current++}`;

  const createDraftListing = () => {
    const id = genId();
    setListings((ls) => ls.concat({
      id, title: '', description: '', region: 'Gilgit-Baltistan', days: 3, price: 0,
      photos: [], bookingMode: 'instant', cancellationPolicy: 'standard',
      departures: [], status: 'draft', createdAt: Date.now(),
    }));
    return id;
  };

  const updateListing = (id, patch) =>
    setListings((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const addPhoto = (id) => {
    setListings((ls) => ls.map((l) => {
      if (l.id !== id) return l;
      const photoId = genId();
      const photos = l.photos.concat({ id: photoId, name: `photo-${l.photos.length + 1}.jpg`, cover: l.photos.length === 0 });
      return { ...l, photos };
    }));
  };

  const removePhoto = (id, photoId) => {
    setListings((ls) => ls.map((l) => {
      if (l.id !== id) return l;
      const wasCover = l.photos.find((p) => p.id === photoId)?.cover;
      let photos = l.photos.filter((p) => p.id !== photoId);
      if (wasCover && photos.length) photos = photos.map((p, i) => ({ ...p, cover: i === 0 }));
      return { ...l, photos };
    }));
  };

  const setCoverPhoto = (id, photoId) => {
    setListings((ls) => ls.map((l) => (l.id === id ? { ...l, photos: l.photos.map((p) => ({ ...p, cover: p.id === photoId })) } : l)));
  };

  // Exact gate formula, CLAUDE.md §6 vendor/gate — checked live, not just at
  // wizard-submit time, so the Gate/Review screens can explain a block
  // whenever the vendor looks (Law 4), not only the moment they clicked.
  const publishGate = (listing, { kycApproved, subOk }) => {
    const blockers = [];
    if (!kycApproved) blockers.push('Identity verification (KYC) is not approved yet');
    if (!subOk) blockers.push('Your subscription needs to be active or in its grace period');
    if (listing.photos.length < 3) blockers.push(`Add ${3 - listing.photos.length} more photo${3 - listing.photos.length === 1 ? '' : 's'} (3 minimum)`);
    if (!(listing.price > 0)) blockers.push('Set a price per person');
    if (listing.departures.length < 1) blockers.push('Add at least one departure in Availability');
    return blockers;
  };

  const publishListing = (id, gateInputs) => {
    const listing = listings.find((l) => l.id === id);
    if (!listing) return { ok: false, blockers: ['Listing not found'] };
    const blockers = publishGate(listing, gateInputs);
    if (blockers.length) return { ok: false, blockers };
    updateListing(id, { status: 'published' });
    return { ok: true, blockers: [] };
  };

  // --- availability (per-listing departures) ----------------------------
  const addDeparture = (listingId, { date, seats }) => {
    setListings((ls) => ls.map((l) => (l.id === listingId
      ? { ...l, departures: l.departures.concat({ id: genId(), date, seats, booked: 0, blackout: false }) }
      : l)));
  };

  // Hard floor at `booked` (§6 vendor/availability) — never lets the cap
  // drop below travellers who already paid for that date.
  const setDepartureSeats = (listingId, depId, seats) => {
    let refused = null;
    setListings((ls) => ls.map((l) => {
      if (l.id !== listingId) return l;
      return {
        ...l,
        departures: l.departures.map((d) => {
          if (d.id !== depId) return d;
          if (seats < d.booked) { refused = d.booked; return d; }
          return { ...d, seats };
        }),
      };
    }));
    return refused === null ? { ok: true } : { ok: false, floor: refused };
  };

  const toggleBlackout = (listingId, depId) => {
    setListings((ls) => ls.map((l) => (l.id === listingId
      ? { ...l, departures: l.departures.map((d) => (d.id === depId ? { ...d, blackout: !d.blackout } : d)) }
      : l)));
  };

  // --- payouts -----------------------------------------------------------
  const setLedgerRowState = (id, state) =>
    setLedger((rows) => rows.map((r) => (r.id === id ? { ...r, state } : r)));

  // Claws back an already-accrued commission (§3 Ledger — "a refund reverses
  // the accrual with it"). Same action a weather cancellation, a dispute
  // refund, or a fraud-review refund all call — never a parallel refund path.
  // Reused by the admin console (module 09) on this vendor's own rows; admin's
  // other, seeded, multi-vendor rows mirror this exact state transition
  // locally rather than reaching into a specific vendor's context (see
  // CLAUDE.md's module 09 note on the single-demo-account limitation).
  const reverseLedger = (id) => setLedgerRowState(id, 'reversed');

  const value = {
    subscription, subscribe, cancelSubscription, simulateChargeFailure,
    retryCharge, exhaustRetries, onGraceExpire, graceDays: GRACE_DAYS,
    listings, createDraftListing, updateListing, addPhoto, removePhoto, setCoverPhoto,
    publishGate, publishListing,
    addDeparture, setDepartureSeats, toggleBlackout,
    ledger, setLedgerRowState, reverseLedger,
  };

  return <VendorContext.Provider value={value}>{children}</VendorContext.Provider>;
}
