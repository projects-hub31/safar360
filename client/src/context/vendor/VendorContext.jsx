import { useCallback, useMemo, useRef, useState } from 'react';
import { VendorContext } from './vendor-context';
import {
  GRACE_DAYS, SEED_LEDGER, LEGACY_SEED_LEDGER_IDS, PLAN_ID_TO_SERVER, SERVER_PLAN_TO_ID,
} from './vendor-context';
import { api } from '../../utils/api';

// Vendor-side state: subscription, listings, payout ledger, the request-to-
// book inbox, and analytics — all real now (server/src/routes/vendor),
// verified end-to-end (CLAUDE.md §9's vendor-backend log). Every action
// below calls the actual backend and normalizes its response into the same
// shape the pages already expect (§7: "a calling component should never
// need to change, only the function body") — Listings.jsx, Availability.jsx,
// Payouts.jsx, Dashboard.jsx etc. are unmodified in what they read off
// `listings`/`ledger`/`subscription`.
//
// Two exceptions kept deliberately mock, both documented in vendor-context.js:
// `SEED_LEDGER`'s 4 rows stay local-only forever (AdminContext's fraud/
// dispute demos and AiContext's weather-cancel demo call `reverseLedger`
// against their fixed ids, and a freshly-registered real vendor's own ledger
// starts empty) — `ledger` state is these seed rows plus whatever the real
// GET /vendor/ledger returns, merged the same way BookingContext's
// `fetchHistory` merges its two legacy seeded bookings back in.
export function VendorProvider({ children }) {
  const [subscription, setSubscription] = useState({
    state: null, plan: null, commissionPct: null, listingCap: null,
    currentPeriodEnd: null, graceDays: GRACE_DAYS, graceStartedAt: null, graceToken: 0,
    graceRemainingSeconds: GRACE_DAYS * 86400,
  });
  const [listings, setListings] = useState([]);
  const [ledger, setLedger] = useState(SEED_LEDGER);
  const [inbox, setInbox] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const patchTimers = useRef({});
  const pendingPatches = useRef({});

  // --- mapping: server DTOs -> the shapes already-built pages expect ------
  const mapSubscription = useCallback((dto) => ({
    state: dto.state,
    plan: SERVER_PLAN_TO_ID[dto.plan] || dto.plan,
    commissionPct: dto.commissionPct,
    listingCap: dto.listingCap == null ? Infinity : dto.listingCap,
    currentPeriodEnd: dto.currentPeriodEnd,
    graceDays: dto.graceDays ?? GRACE_DAYS,
    graceStartedAt: dto.graceStartedAt,
    // Grace.jsx keys its Countdown off this so a fresh grace period restarts
    // the clock (mirrors the old mock's incrementing counter) — the real
    // graceStartedAt timestamp itself already changes exactly when a new
    // grace period starts, so it does the same job with no counter needed.
    graceToken: dto.graceStartedAt || 0,
    // Computed once here (an action body, not render — CLAUDE.md §7's
    // purity rule) rather than diffing a stored timestamp against Date.now()
    // in Grace.jsx's render: real remaining time, not always a fresh 3 days,
    // since this state now genuinely persists across reloads server-side.
    graceRemainingSeconds: dto.state === 'grace' && dto.graceStartedAt
      ? Math.max(0, Math.round((dto.graceDays ?? GRACE_DAYS) * 86400 - (Date.now() - new Date(dto.graceStartedAt).getTime()) / 1000))
      : (dto.graceDays ?? GRACE_DAYS) * 86400,
  }), []);

  const mapPhoto = useCallback((p) => ({ id: p.id, name: p.fileRef, cover: p.cover }), []);

  const mapListing = useCallback((dto) => ({
    id: dto.id,
    title: dto.title,
    description: dto.description || '',
    region: dto.region,
    days: dto.days,
    price: dto.price,
    photos: dto.photos.map(mapPhoto),
    bookingMode: dto.bookingMode,
    cancellationPolicy: dto.cancellationPolicy,
    departures: dto.departures.map((d) => ({
      id: d.id,
      date: new Date(d.date).toISOString().slice(0, 10), // matches <input type="date">'s value shape
      seats: d.seatsTotal,
      booked: d.booked,
      blackout: d.blackout,
    })),
    status: dto.status,
    createdAt: dto.createdAt,
  }), [mapPhoto]);

  const mapLedgerRow = useCallback((dto) => ({
    id: dto.id,
    ledgerId: dto.ledgerId,
    kind: dto.kind,
    ref: dto.ref,
    label: dto.label,
    gross: dto.gross,
    rate: dto.rate,
    commission: dto.commission,
    net: dto.net,
    state: dto.state,
    via: dto.via,
    at: dto.at,
  }), []);

  // --- subscription --------------------------------------------------
  const fetchSubscription = useCallback(async () => {
    const res = await api.get('/vendor/subscription');
    if (res.ok) setSubscription(mapSubscription(res.data));
  }, [mapSubscription]);

  const subscribe = useCallback(async (planId) => {
    const res = await api.post('/vendor/subscription/subscribe', { plan: PLAN_ID_TO_SERVER[planId] || planId });
    if (!res.ok) return { ok: false, message: res.error.message };
    setSubscription(mapSubscription(res.data));
    return { ok: true };
  }, [mapSubscription]);

  const cancelSubscription = useCallback(async () => {
    const res = await api.post('/vendor/subscription/cancel');
    if (res.ok) setSubscription(mapSubscription(res.data));
  }, [mapSubscription]);

  // Dev-only testing levers — no live recurring billing exists to fail for
  // real, but these now flip the real Subscription document server-side
  // (server/src/services/subscription.service.js), same honestly-labeled
  // shape as before.
  const simulateChargeFailure = useCallback(async () => {
    const res = await api.post('/vendor/subscription/simulate-charge-failure');
    if (res.ok) setSubscription(mapSubscription(res.data));
  }, [mapSubscription]);

  const retryCharge = useCallback(async () => {
    const res = await api.post('/vendor/subscription/retry');
    if (res.ok) setSubscription(mapSubscription(res.data));
  }, [mapSubscription]);

  const exhaustRetries = useCallback(async () => {
    const res = await api.post('/vendor/subscription/exhaust-retries');
    if (res.ok) setSubscription(mapSubscription(res.data));
  }, [mapSubscription]);

  // The 3-day grace clock is real, server-anchored state (settled lazily on
  // read, subscription.service.js's settleTimers) — there's no client-side
  // "expire" action anymore, only a re-fetch to pick up whatever the server
  // has already settled it to.
  const onGraceExpire = useCallback(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // --- listings --------------------------------------------------------
  const fetchListings = useCallback(async () => {
    const res = await api.get('/vendor/listings');
    if (res.ok) setListings(res.data.map(mapListing));
  }, [mapListing]);

  const createDraftListing = useCallback(async () => {
    const res = await api.post('/vendor/listings');
    if (!res.ok) return null;
    const mapped = mapListing(res.data);
    setListings((ls) => ls.concat(mapped));
    return mapped.id;
  }, [mapListing]);

  // Optimistic + debounced: the Basics step patches on every keystroke
  // (title/description/days/price/region), and the local field names already
  // match the PATCH body 1:1 — so the local update is a plain merge, applied
  // immediately for instant typing feel, while the real PATCH is debounced
  // 500ms after the last change so typing doesn't fire one request per
  // keystroke (CLAUDE.md §6: "Autosave drafts per step," not per keystroke).
  const updateListing = useCallback((id, patch) => {
    setListings((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    // Accumulate across rapid successive edits (e.g. title then price before
    // the timer fires) — sending only the latest single-field patch would
    // silently drop the earlier field from the real PATCH.
    pendingPatches.current[id] = { ...pendingPatches.current[id], ...patch };
    clearTimeout(patchTimers.current[id]);
    patchTimers.current[id] = setTimeout(async () => {
      const toSend = pendingPatches.current[id];
      delete pendingPatches.current[id];
      const res = await api.patch(`/vendor/listings/${id}`, toSend);
      if (res.ok) setListings((ls) => ls.map((l) => (l.id === id ? mapListing(res.data) : l)));
    }, 500);
  }, [mapListing]);

  const addPhoto = useCallback(async (id) => {
    const fileRef = `photo-${Date.now()}.jpg`; // no real upload/storage service yet (CLAUDE.md §9) — a name stands in
    const res = await api.post(`/vendor/listings/${id}/photos`, { fileRef });
    if (res.ok) setListings((ls) => ls.map((l) => (l.id === id ? mapListing(res.data) : l)));
  }, [mapListing]);

  const removePhoto = useCallback(async (id, photoId) => {
    const res = await api.del(`/vendor/listings/${id}/photos/${photoId}`);
    if (res.ok) setListings((ls) => ls.map((l) => (l.id === id ? mapListing(res.data) : l)));
  }, [mapListing]);

  const setCoverPhoto = useCallback(async (id, photoId) => {
    const res = await api.post(`/vendor/listings/${id}/photos/${photoId}/cover`);
    if (res.ok) setListings((ls) => ls.map((l) => (l.id === id ? mapListing(res.data) : l)));
  }, [mapListing]);

  // The real gate (server/src/utils/publishGate.js) is checked live against
  // this vendor's actual KYC/subscription/plan-cap state — the second
  // argument callers still pass (Listings.jsx's own live preview inputs) is
  // no longer read here; the server is the only truth now (§2 law). Flushes
  // any still-debounced Basics-step edit first (updateListing above), so a
  // fast Next-Next-Next-Publish click right after typing a price can't race
  // the server into seeing a stale value and blocking on it.
  const publishListing = useCallback(async (id) => {
    if (pendingPatches.current[id]) {
      clearTimeout(patchTimers.current[id]);
      const toSend = pendingPatches.current[id];
      delete pendingPatches.current[id];
      await api.patch(`/vendor/listings/${id}`, toSend);
    }
    const res = await api.post(`/vendor/listings/${id}/publish`);
    if (!res.ok) return { ok: false, blockers: [res.error.message] };
    if (!res.data.published) return { ok: false, blockers: res.data.blockers };
    setListings((ls) => ls.map((l) => (l.id === id ? { ...l, status: 'published' } : l)));
    return { ok: true, blockers: [] };
  }, []);

  // --- availability (per-listing departures) ----------------------------
  const addDeparture = useCallback(async (listingId, { date, seats }) => {
    const res = await api.post(`/vendor/listings/${listingId}/departures`, { date, seatsTotal: seats });
    if (res.ok) setListings((ls) => ls.map((l) => (l.id === listingId ? mapListing(res.data) : l)));
  }, [mapListing]);

  // Hard floor at `booked` (§6 vendor/availability) — the server is the real
  // enforcer; `floor` on a refusal is read back from this vendor's own
  // already-known departure state rather than parsed out of the error text.
  const setDepartureSeats = useCallback(async (listingId, depId, seats) => {
    const res = await api.patch(`/vendor/listings/${listingId}/departures/${depId}`, { seatsTotal: seats });
    if (!res.ok) {
      const dep = listings.find((l) => l.id === listingId)?.departures.find((d) => d.id === depId);
      return { ok: false, floor: dep?.booked };
    }
    setListings((ls) => ls.map((l) => (l.id === listingId ? mapListing(res.data) : l)));
    return { ok: true };
  }, [listings, mapListing]);

  const toggleBlackout = useCallback(async (listingId, depId) => {
    const res = await api.post(`/vendor/listings/${listingId}/departures/${depId}/blackout`);
    if (res.ok) setListings((ls) => ls.map((l) => (l.id === listingId ? mapListing(res.data) : l)));
  }, [mapListing]);

  // --- payouts -----------------------------------------------------------
  // Re-fetches and replaces every non-seeded row each call (the server is
  // the truth) while preserving the 4 legacy seeded rows other modules'
  // demos point at (see vendor-context.js's SEED_LEDGER comment) — same
  // "preserve legacy, replace the rest" shape as BookingContext.fetchHistory.
  const fetchLedger = useCallback(async () => {
    const res = await api.get('/vendor/ledger');
    if (!res.ok) return;
    const real = res.data.map(mapLedgerRow);
    setLedger((current) => [...current.filter((r) => LEGACY_SEED_LEDGER_IDS.has(r.id)), ...real]);
  }, [mapLedgerRow]);

  const reverseLedger = useCallback(async (id) => {
    if (LEGACY_SEED_LEDGER_IDS.has(id)) {
      setLedger((rows) => rows.map((r) => (r.id === id ? { ...r, state: 'reversed' } : r)));
      return;
    }
    const res = await api.post(`/vendor/ledger/${id}/reverse`);
    if (res.ok) setLedger((rows) => rows.map((r) => (r.id === id ? mapLedgerRow(res.data) : r)));
  }, [mapLedgerRow]);

  // --- booking inbox (request-to-book, §6 vendor/inbox + booking detail) --
  // Ownership-scoped server-side (controllers/vendor/bookings.controller.js)
  // — this vendor only ever sees requests against their own tours.
  const fetchInbox = useCallback(async () => {
    const res = await api.get('/vendor/bookings');
    if (res.ok) setInbox(res.data);
  }, []);

  const acceptBooking = useCallback(async (ref) => {
    const res = await api.post(`/vendor/bookings/${ref}/decision`, { action: 'accept' });
    if (!res.ok) return { ok: false, message: res.error.message };
    setInbox((rows) => rows.map((r) => (r.id === ref ? res.data : r)));
    return { ok: true };
  }, []);

  // `reason` is one of the 4 fixed reason ids (DECLINE_REASONS, vendor-
  // context.js) — validated again server-side, same rule on both sides.
  const declineBooking = useCallback(async (ref, reason) => {
    const res = await api.post(`/vendor/bookings/${ref}/decision`, { action: 'decline', reason });
    if (!res.ok) return { ok: false, message: res.error.message };
    setInbox((rows) => rows.map((r) => (r.id === ref ? res.data : r)));
    return { ok: true };
  }, []);

  // --- analytics (§6 vendor/analytics) ------------------------------------
  const fetchAnalytics = useCallback(async () => {
    const res = await api.get('/vendor/analytics');
    if (res.ok) setAnalytics(res.data);
  }, []);

  const value = useMemo(() => ({
    subscription, fetchSubscription, subscribe, cancelSubscription, simulateChargeFailure,
    retryCharge, exhaustRetries, onGraceExpire, graceDays: GRACE_DAYS,
    listings, fetchListings, createDraftListing, updateListing, addPhoto, removePhoto, setCoverPhoto,
    publishListing,
    addDeparture, setDepartureSeats, toggleBlackout,
    ledger, fetchLedger, reverseLedger,
    inbox, fetchInbox, acceptBooking, declineBooking,
    analytics, fetchAnalytics,
  }), [
    subscription, fetchSubscription, subscribe, cancelSubscription, simulateChargeFailure,
    retryCharge, exhaustRetries, onGraceExpire,
    listings, fetchListings, createDraftListing, updateListing, addPhoto, removePhoto, setCoverPhoto,
    publishListing,
    addDeparture, setDepartureSeats, toggleBlackout,
    ledger, fetchLedger, reverseLedger,
    inbox, fetchInbox, acceptBooking, declineBooking,
    analytics, fetchAnalytics,
  ]);

  return <VendorContext.Provider value={value}>{children}</VendorContext.Provider>;
}
