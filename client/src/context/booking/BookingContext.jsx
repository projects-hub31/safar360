import { useCallback, useMemo, useState } from 'react';
import { BookingContext } from './booking-context';
import { SERVICE_FEE_PCT, PROMO_CODES } from './booking-context';
import { AVAILABILITY, refundPct } from '../../data/traveler/tours';
import { api } from '../../utils/api';

// --- real backend throughout (server/src/routes/booking) -------------------
// startLock/beginCapture/checkBookingStatus/cancelBooking (for a real ref)/
// fetchHistory/createRequest/startGroupSplit/fetchGroup/payShare all call the
// actual server, verified end-to-end (CLAUDE.md §9). Request-to-book's
// operator side (accept/decline) now lives at VendorContext — a real
// ownership-scoped vendor inbox exists (controllers/vendor/
// bookings.controller.js), so this file no longer needs its own
// accept/declineRequest or a local `requests` queue; a traveller only ever
// creates a request here and polls its status (AwaitingAccept.jsx), exactly
// like the instant-mode Awaiting.jsx screen already does.
// `avail`/`bookings` below stay a canonical client-side seat store / seeded
// legacy bookings — see each's own comment; `groups` is a real client-side
// cache of server responses, not mock state.
const LEGACY_SEED_REFS = new Set(['SFR-2026-0814-5521', 'SFR-2026-0801-2210']);

// One seeded confirmed booking, matching VendorContext.SEED_LEDGER's `LG-4003`
// row (gross 217200 = 3 seats × Rs 72,400, still `accruing` there rather than
// already touched by the admin fraud/dispute demos) — added specifically so
// the AI module's weather-override flow (§3) has a genuine booking to run the
// real, shared `cancelBooking` action against, and a genuine linked ledger
// row for `reverseLedger` to flip. Every other booking in this app is created
// live by an actual checkout; this is the one deliberate exception, and it
// exists purely to make "no separate weather-refund code path" true rather
// than aspirational (see `AiContext.jsx`'s `decideWeatherAlert`).
const SEEDED_BOOKING = {
  ref: 'SFR-2026-0814-5521', tourId: 'kkh', title: 'Karakoram Highway to Khunjerab — 6 days',
  seats: 3, total: 217200, method: 'card', state: 'confirmed', guests: [],
  departureAt: Date.now() + 6 * 86400000, cancellationPolicy: 'standard', at: Date.now() - 5 * 86400000,
};

// A second seeded confirmed booking, this one already *in progress* (its
// `departureAt` is 2 days in the past against a 5-day tour, putting "today"
// on day 3) rather than upcoming — needed because `ai/tracking`'s live
// in-trip location screen (§6 08-ai `isTracking`) has nothing honest to show
// against a booking that hasn't departed yet. Matches
// `VendorContext.SEED_LEDGER`'s still-`released`, still-untouched `LG-4001`
// row (gross 113250 = 2 seats × Rs 56,625, Hunza & Attabad Lake) — same
// "reuse a real seam, don't invent a disconnected demo booking" reasoning as
// `SEEDED_BOOKING` above.
const SEEDED_ACTIVE_BOOKING = {
  ref: 'SFR-2026-0801-2210', tourId: 'hunza', title: 'Hunza & Attabad Lake — 5 days',
  seats: 2, total: 113250, method: 'jazzcash', state: 'confirmed', guests: [],
  departureAt: Date.now() - 2 * 86400000, cancellationPolicy: 'standard', at: Date.now() - 12 * 86400000,
};

export function BookingProvider({ children }) {
  // Canonical, mutable seat availability — every screen that shows or changes
  // a seat count reads this, not the static seed in tours.js (§3: the server
  // is the truth; availability is never static client state once bookings can
  // actually deduct it).
  const [avail, setAvail] = useState(() => ({ ...AVAILABILITY }));
  const [lock, setLock] = useState(null);
  const [paymentState, setPaymentState] = useState('idle');
  const [bookings, setBookings] = useState(() => [SEEDED_BOOKING, SEEDED_ACTIVE_BOOKING]);
  const [groups, setGroups] = useState([]);

  // --- locking (instant-mode bookings only) — real POST /booking/lock ----
  // Returns { ok, message? } so the caller (TourDetail) can show a real
  // server rejection (e.g. someone else just took the last seat) instead of
  // navigating to an empty Checkout.
  const startLock = useCallback(async ({ tourId, departureId, title, price, seats, cancellationPolicy }) => {
    const res = await api.post('/booking/lock', { tourId, departureId, seats });
    if (!res.ok) return { ok: false, message: res.error.message };
    const d = res.data;
    setLock({
      lockId: d.lockId,
      lockToken: d.lockId, // alias — Checkout/Awaiting display this as a countdown key / demo id
      tourId: d.tourId,
      departureId: d.departureId,
      title: d.title || title,
      price: d.price ?? price,
      seats: d.seats,
      cancellationPolicy: d.cancellationPolicy || cancellationPolicy || 'standard',
      minutes: d.minutes,
      expiresAt: new Date(d.expiresAt).getTime(),
      extended: false,
      guests: [],
      method: null,
      methodDetail: '',
      promoCode: null,
      discountPct: 0,
      ref: null,
    });
    setPaymentState('idle');
    return { ok: true };
  }, []);

  const setGuests = useCallback((guests) => setLock((l) => (l ? { ...l, guests } : l)), []);

  const applyPromo = useCallback((code) => {
    const norm = code.trim().toUpperCase();
    const pct = PROMO_CODES[norm];
    if (!pct) {
      setLock((l) => (l ? { ...l, promoCode: null, discountPct: 0 } : l));
      return { ok: false, message: `"${code}" is not a code we recognise. Check for a typo.` };
    }
    setLock((l) => (l ? { ...l, promoCode: norm, discountPct: pct } : l));
    return { ok: true, pct };
  }, []);

  const chooseMethod = useCallback((method, detail) =>
    setLock((l) => (l ? { ...l, method, methodDetail: detail, extended: method === 'bank' } : l)), []);

  // Pay button pressed — real POST /booking/checkout. `guests` is passed in
  // directly rather than read off `lock.guests` because the caller
  // (Checkout.jsx) calls `setGuests(rows)` and this in the same handler —
  // React state updates are batched, so `lock` in this closure could still be
  // last render's stale value; the explicit argument sidesteps that instead
  // of relying on render timing (CLAUDE.md §7's setState-purity rule, same
  // spirit, different hazard: a stale-closure read, not an impure updater).
  // Returns { ok, message? } — on success `lock.ref` is set for Awaiting to
  // poll; nothing is captured yet, the webhook (server-side) is what commits.
  const beginCapture = useCallback(async (guests) => {
    if (!lock) return { ok: false, message: 'Your hold is no longer active.' };
    setPaymentState('pending');
    const res = await api.post('/booking/checkout', {
      lockId: lock.lockId,
      guests,
      method: lock.method,
      methodDetail: lock.methodDetail,
      promoCode: lock.promoCode,
    });
    if (!res.ok) {
      setPaymentState('idle');
      return { ok: false, message: res.error.message };
    }
    setLock((l) => (l ? { ...l, guests, ref: res.data.ref } : l));
    return { ok: true };
  }, [lock]);

  // Lock TTL elapsed with no payment submitted — slot returns to the public
  // pool untouched (nothing was ever deducted).
  const expireLock = useCallback(() => {
    setLock(null);
    setPaymentState('idle');
  }, []);

  const clearLock = useCallback(() => {
    setLock(null);
    setPaymentState('idle');
  }, []);

  const totalsFor = useCallback((l) => {
    const subtotal = l.price * l.seats;
    const discount = Math.round(subtotal * (l.discountPct / 100));
    const fee = Math.round((subtotal - discount) * SERVICE_FEE_PCT);
    return { subtotal, discount, fee, total: subtotal - discount + fee };
  }, []);

  // Polled by both Awaiting (instant mode) and AwaitingAccept (request mode)
  // — real GET /booking/status/:ref — once a second until the outcome is
  // decided server-side (a webhook for instant mode, the vendor's own
  // accept/decline for request mode; neither is ever decided client-side).
  // Returns { kind: 'pending' } while still in flight (covers both a
  // genuinely pending payment and an awaiting-accept request), or a terminal
  // { kind, reason, ref } once the server has an answer — 'declined' is the
  // one terminal kind that's request-mode-only.
  const checkBookingStatus = useCallback(async (ref) => {
    const res = await api.get(`/booking/status/${ref}`);
    if (!res.ok) return { kind: 'pending' }; // transient hiccup — keep polling
    const { status, outcomeReason, outcomeKind } = res.data;
    if (status === 'pending' || status === 'awaiting-accept') return { kind: 'pending' };

    setLock(null);
    if (status === 'confirmed' || status === 'held' || status === 'failed') {
      setPaymentState(status === 'confirmed' ? 'confirmed' : status === 'held' ? 'held' : 'failed');
    }
    return { kind: outcomeKind || status, reason: outcomeReason, ref };
  }, []);

  // --- request-to-book (operator-mediated, no lock, no charge) -----------
  // No seat is touched and nothing is charged until the vendor's own
  // ownership-scoped decision (VendorContext.acceptBooking/declineBooking)
  // — this only creates the request and hands back its ref for
  // AwaitingAccept.jsx to poll via checkBookingStatus above.
  const createRequest = useCallback(async ({ tourId, departureId, seats, guests }) => {
    const res = await api.post('/booking/request', { tourId, departureId, seats, guests });
    if (!res.ok) return { ok: false, message: res.error.message };
    return { ok: true, ref: res.data.ref, deadlineAt: res.data.deadlineAt };
  }, []);

  // --- history (real GET /booking/history) --------------------------------
  // Re-fetches and replaces every non-seeded row each call (the server is the
  // truth) while preserving the two legacy seeded demo bookings the AI module
  // reads by fixed ref (see LEGACY_SEED_REFS above). Declared here (ahead of
  // group split below) so payShare can call it the moment a split's final
  // share confirms a real booking, without a forward-reference.
  const fetchHistory = useCallback(async () => {
    const res = await api.get('/booking/history');
    if (!res.ok) return;
    const real = res.data.map((b) => ({
      ref: b.ref,
      tourId: b.tourId,
      title: b.title,
      seats: b.seats,
      total: b.total,
      method: b.method,
      state: b.status,
      guests: b.guests || [],
      departureAt: b.departureAt ? new Date(b.departureAt).getTime() : null,
      cancellationPolicy: b.cancellationPolicy,
      refundPct: b.refundPct,
      refundAmount: b.refundAmount,
      at: new Date(b.at).getTime(),
    }));
    setBookings((current) => [...current.filter((b) => LEGACY_SEED_REFS.has(b.ref)), ...real]);
  }, []);

  // --- group split (all-or-nothing) — real backend (server/src/routes/
  // booking/group.routes.js), verified end-to-end (CLAUDE.md §9). No lock and
  // no charge happens on start — the real capture point is the final
  // participant's payment, which is also the one place inventory is ever
  // touched (mirrors the instant-checkout webhook's atomic deduction).
  const mapGroup = useCallback((d) => ({
    id: d.id,
    tourId: d.tourId,
    departureId: d.departureId,
    title: d.title,
    price: d.price,
    total: d.total,
    deadlineAt: new Date(d.deadlineAt).getTime(),
    status: d.status,
    participants: d.participants,
    bookingRef: d.bookingRef,
    outcomeReason: d.outcomeReason,
  }), []);

  const upsertGroup = useCallback((dto) => {
    const mapped = mapGroup(dto);
    setGroups((gs) => (gs.some((g) => g.id === mapped.id) ? gs.map((g) => (g.id === mapped.id ? mapped : g)) : gs.concat(mapped)));
    return mapped;
  }, [mapGroup]);

  const startGroupSplit = useCallback(async ({ tourId, departureId, participantNames }) => {
    const res = await api.post('/booking/group/start', { tourId, departureId, participantNames });
    if (!res.ok) return { ok: false, message: res.error.message };
    const group = upsertGroup(res.data);
    return { ok: true, id: group.id };
  }, [upsertGroup]);

  // Re-reads the real, server-authoritative status — a participant may have
  // no account at all (§3), so this is the source of truth on every mount,
  // not whatever (if anything) already happens to be in local `groups`.
  const fetchGroup = useCallback(async (groupId) => {
    const res = await api.get(`/booking/group/${groupId}`);
    if (!res.ok) return { ok: false, message: res.error.message };
    return { ok: true, group: upsertGroup(res.data) };
  }, [upsertGroup]);

  const payShare = useCallback(async (groupId, index) => {
    const res = await api.post(`/booking/group/${groupId}/participants/${index}/pay`);
    if (!res.ok) return { ok: false, message: res.error.message };
    const group = upsertGroup(res.data);
    if (group.status === 'confirmed' && group.bookingRef) await fetchHistory();
    return { ok: true, group };
  }, [upsertGroup, fetchHistory]);

  // The 24h window is server-side truth (deadlineAt), not something the
  // client can force — this just re-fetches so the UI reflects the real
  // lazy-settled state once the client's own countdown reaches zero.
  const lapseGroup = useCallback((groupId) => {
    fetchGroup(groupId);
  }, [fetchGroup]);

  // --- cancellation --------------------------------------------------------
  // `overridePct` lets a caller that already knows the correct refund rate
  // (the AI module's weather-override flow reads `policy.weatherRefundPct`
  // live from AdminContext, which this context has no access to — see
  // `AiContext.decideWeatherAlert`) supply it directly, instead of this
  // function computing one from `reason`/the listing's own policy tier. Only
  // meaningful for the two legacy seeded bookings below, which predate the
  // real backend and have no server-side row — a real booking's refund % is
  // always computed server-side (booking.controller.js's own refundPct call).
  const cancelBooking = useCallback(async (ref, reason, overridePct = null) => {
    if (LEGACY_SEED_REFS.has(ref)) {
      const booking = bookings.find((b) => b.ref === ref);
      if (!booking) return null;
      const pct = overridePct !== null
        ? overridePct
        : reason === 'operator'
          ? 100
          : refundPct(
            booking.cancellationPolicy,
            booking.departureAt ? Math.max(0, (booking.departureAt - Date.now()) / 3600000) : 999,
          );
      const amount = Math.round(booking.total * (pct / 100));
      setAvail((current) => ({ ...current, [booking.tourId]: (current[booking.tourId] ?? 0) + booking.seats }));
      setBookings((bs) => bs.map((b) => (b.ref === ref ? { ...b, state: 'cancelled', refundPct: pct, refundAmount: amount, cancelReason: reason } : b)));
      return { pct, amount };
    }

    const res = await api.post(`/booking/${ref}/cancel`, { reason });
    if (!res.ok) return null;
    setBookings((bs) => bs.map((b) => (b.ref === ref ? { ...b, state: 'cancelled', refundPct: res.data.pct, refundAmount: res.data.amount, cancelReason: reason } : b)));
    return res.data;
  }, [bookings]);

  const value = useMemo(() => ({
    avail,
    lock,
    paymentState,
    bookings,
    groups,
    startLock,
    setGuests,
    applyPromo,
    chooseMethod,
    beginCapture,
    expireLock,
    clearLock,
    totalsFor,
    checkBookingStatus,
    fetchHistory,
    createRequest,
    startGroupSplit,
    fetchGroup,
    payShare,
    lapseGroup,
    cancelBooking,
  }), [
    avail, lock, paymentState, bookings, groups,
    startLock, setGuests, applyPromo, chooseMethod, beginCapture, expireLock, clearLock,
    totalsFor, checkBookingStatus, fetchHistory, createRequest,
    startGroupSplit, fetchGroup, payShare, lapseGroup, cancelBooking,
  ]);

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}
