import { useRef, useState } from 'react';
import { BookingContext } from './booking-context';
import {
  LOCK_MINUTES,
  REQUEST_WINDOW_HOURS,
  GROUP_WINDOW_HOURS,
  SERVICE_FEE_PCT,
  PROMO_CODES,
  DECLINE_CARD,
  FRAUD_CARD,
  FRAUD_AMOUNT_THRESHOLD,
  refFor,
} from './booking-context';
import { AVAILABILITY, refundPct } from '../data/traveler/tours';

const FAIL_REASONS = {
  failed: 'Your card was declined by the issuing bank. Nothing was charged.',
  held: 'Score above the review threshold — a human checks this within the hour.',
  late: 'Your payment arrived after the hold expired. Refunded automatically — the seat had already gone.',
  'sold-out': 'Someone completed payment for the last seat moments before you. Refunded automatically.',
};

export function BookingProvider({ children }) {
  // Canonical, mutable seat availability — every screen that shows or changes
  // a seat count reads this, not the static seed in tours.js (§3: the server
  // is the truth; availability is never static client state once bookings can
  // actually deduct it).
  const [avail, setAvail] = useState(() => ({ ...AVAILABILITY }));
  const [lock, setLock] = useState(null);
  const [paymentState, setPaymentState] = useState('idle');
  const [bookings, setBookings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [groups, setGroups] = useState([]);

  // Monotonic ids — generated inside event handlers (never render), so a
  // plain incrementing counter is simpler and just as safe as Date.now().
  const nextId = useRef(1);
  const genId = (prefix) => `${prefix}${nextId.current++}`;

  // --- locking (instant-mode bookings only) -----------------------------
  // `departureDays` (days from today) is the caller's input, not a raw
  // timestamp — Date.now() is only ever touched inside functions like this
  // one that run from an event handler, never in a component's render body.
  const startLock = ({ tourId, title, price, seats, departureDays, cancellationPolicy }) => {
    const token = nextId.current++;
    setLock({
      lockToken: token,
      tourId,
      title,
      price,
      seats,
      departureAt: typeof departureDays === 'number' ? Date.now() + departureDays * 86400000 : null,
      cancellationPolicy: cancellationPolicy || 'standard',
      minutes: LOCK_MINUTES,
      expiresAt: Date.now() + LOCK_MINUTES * 60000, // event handler — safe
      extended: false,
      guests: [],
      method: null,
      methodDetail: '',
      promoCode: null,
      discountPct: 0,
    });
    setPaymentState('idle');
    return token;
  };

  const setGuests = (guests) => setLock((l) => (l ? { ...l, guests } : l));

  const applyPromo = (code) => {
    const norm = code.trim().toUpperCase();
    const pct = PROMO_CODES[norm];
    if (!pct) {
      setLock((l) => (l ? { ...l, promoCode: null, discountPct: 0 } : l));
      return { ok: false, message: `"${code}" is not a code we recognise. Check for a typo.` };
    }
    setLock((l) => (l ? { ...l, promoCode: norm, discountPct: pct } : l));
    return { ok: true, pct };
  };

  const chooseMethod = (method, detail) =>
    setLock((l) => (l ? { ...l, method, methodDetail: detail, extended: method === 'bank' } : l));

  // Pay button pressed — moves the ladder to "authorized, awaiting webhook".
  // Nothing is captured yet; resolvePayment() (called from the awaiting
  // screen) is what actually commits or fails the attempt.
  const beginCapture = () => setPaymentState('pending');

  // Lock TTL elapsed with no payment submitted — slot returns to the public
  // pool untouched (nothing was ever deducted).
  const expireLock = () => {
    setLock(null);
    setPaymentState('idle');
  };

  const clearLock = () => {
    setLock(null);
    setPaymentState('idle');
  };

  const totalsFor = (l) => {
    const subtotal = l.price * l.seats;
    const discount = Math.round(subtotal * (l.discountPct / 100));
    const fee = Math.round((subtotal - discount) * SERVICE_FEE_PCT);
    return { subtotal, discount, fee, total: subtotal - discount + fee };
  };

  // The one place seats actually leave the pool and a booking is written —
  // called from both the normal auto-resolve path and the forced-outcome
  // panel's "confirmed" branch, so there is exactly one commit path (§3 Law 1).
  const commitConfirmed = (l) => {
    const { total } = totalsFor(l);
    const ref = refFor('SFR');
    setAvail((current) => ({ ...current, [l.tourId]: (current[l.tourId] ?? 0) - l.seats }));
    setBookings((bs) => bs.concat({
      ref,
      tourId: l.tourId,
      title: l.title,
      seats: l.seats,
      total,
      method: l.method,
      state: 'confirmed',
      guests: l.guests,
      departureAt: l.departureAt,
      cancellationPolicy: l.cancellationPolicy,
      at: Date.now(),
    }));
    setPaymentState('confirmed');
    setLock(null);
    return { kind: 'confirmed', ref };
  };

  // The real decision: card/amount rules first (deterministic, documented —
  // see booking-context.js), then the atomic seat check (§3). Called once by
  // the awaiting screen after its own simulated webhook delay.
  const resolvePayment = () => {
    if (!lock) return { kind: 'expired' };
    if (Date.now() > lock.expiresAt && !lock.extended) {
      setPaymentState('failed');
      setLock(null);
      return { kind: 'late', reason: FAIL_REASONS.late };
    }

    const { total } = totalsFor(lock);
    const digits = (lock.methodDetail || '').replace(/\D/g, '');

    if (lock.method === 'card' && digits === DECLINE_CARD) {
      setPaymentState('failed');
      setLock(null);
      return { kind: 'failed', reason: FAIL_REASONS.failed };
    }
    if (lock.method === 'card' && digits === FRAUD_CARD) {
      setPaymentState('held');
      setLock(null);
      return { kind: 'held', reason: FAIL_REASONS.held };
    }
    if ((lock.method === 'jazzcash' || lock.method === 'easypaisa') && digits.endsWith('0000')) {
      setPaymentState('failed');
      setLock(null);
      return { kind: 'failed', reason: `${lock.method === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'} declined the charge. Nothing was captured.` };
    }
    if (total >= FRAUD_AMOUNT_THRESHOLD) {
      setPaymentState('held');
      setLock(null);
      return { kind: 'held', reason: `Rs ${total.toLocaleString('en-US')} is well above a typical first booking — held for a human review.` };
    }

    const seatsLeft = avail[lock.tourId] ?? 0;
    if (seatsLeft < lock.seats) {
      setPaymentState('failed');
      setLock(null);
      return { kind: 'sold-out', reason: FAIL_REASONS['sold-out'] };
    }

    return commitConfirmed(lock);
  };

  // No live gateway to actually decline/hold/race a booking against — this
  // exercises the exact same commit/fail/hold paths as resolvePayment, just
  // picked explicitly rather than derived, so every branch of the state
  // machine stays reachable for testing. Same honest framing as the KYC
  // preview links in identity (module 03).
  const forceOutcome = (kind) => {
    if (!lock) return { kind: 'expired' };
    if (kind === 'confirmed') return commitConfirmed(lock);
    setPaymentState(kind === 'held' ? 'held' : 'failed');
    setLock(null);
    return { kind, reason: FAIL_REASONS[kind] || 'Forced outcome for testing.' };
  };

  // --- request-to-book (operator-mediated, no lock, no charge) -----------
  const createRequest = ({ tourId, title, price, seats, guests }) => {
    const id = genId('rq');
    setRequests((rs) => rs.concat({
      id, tourId, title, price, seats, guests: guests || [],
      deadlineAt: Date.now() + REQUEST_WINDOW_HOURS * 3600000,
      status: 'pending',
    }));
    return id;
  };

  const acceptRequest = (id) => {
    const req = requests.find((r) => r.id === id);
    if (!req || req.status !== 'pending') return null;
    setAvail((current) => ({ ...current, [req.tourId]: (current[req.tourId] ?? 0) - req.seats }));
    const ref = refFor('SFR');
    setBookings((bs) => bs.concat({
      ref, tourId: req.tourId, title: req.title, seats: req.seats,
      total: req.price * req.seats, method: null, state: 'confirmed',
      guests: req.guests || [], departureAt: null, cancellationPolicy: 'standard', at: Date.now(),
    }));
    setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status: 'accepted', ref } : r)));
    return ref;
  };

  const declineRequest = (id, reason) => {
    setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status: 'declined', reason } : r)));
  };

  // --- group split (all-or-nothing) --------------------------------------
  const startGroupSplit = ({ tourId, title, price, participantNames }) => {
    const id = genId('gp');
    setGroups((gs) => gs.concat({
      id, tourId, title, price,
      deadlineAt: Date.now() + GROUP_WINDOW_HOURS * 3600000,
      status: 'open',
      participants: participantNames.map((name) => ({ name, status: 'unpaid' })),
    }));
    return id;
  };

  // The allPaid decision is made once here, from the closure's current
  // `groups` (safe — this only ever runs from an event handler, so it's the
  // latest render's state). setGroups' own updater below stays pure — it
  // must never trigger other setState calls as a side effect, since
  // StrictMode deliberately invokes updaters twice in dev to catch exactly
  // that, and doing so here would silently double-book and double-decrement
  // availability.
  const payShare = (groupId, index) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    const participants = group.participants.map((p, i) => (i === index ? { ...p, status: 'paid' } : p));
    const allPaid = participants.every((p) => p.status === 'paid');

    setGroups((gs) => gs.map((g) => (g.id === groupId ? { ...g, participants, status: allPaid ? 'confirmed' : g.status } : g)));

    if (allPaid) {
      setAvail((current) => ({ ...current, [group.tourId]: (current[group.tourId] ?? 0) - participants.length }));
      setBookings((bs) => bs.concat({
        ref: refFor('SFR'), tourId: group.tourId, title: group.title, seats: participants.length,
        total: group.price * participants.length, method: 'group', state: 'confirmed',
        guests: [], departureAt: null, cancellationPolicy: 'standard', at: Date.now(),
      }));
    }
  };

  const lapseGroup = (groupId) => {
    setGroups((gs) => gs.map((g) => (g.id === groupId && g.status === 'open' ? { ...g, status: 'lapsed' } : g)));
  };

  // --- cancellation --------------------------------------------------------
  const cancelBooking = (ref, reason) => {
    const booking = bookings.find((b) => b.ref === ref);
    if (!booking) return null;
    const pct = reason === 'operator'
      ? 100
      : refundPct(
        booking.cancellationPolicy,
        booking.departureAt ? Math.max(0, (booking.departureAt - Date.now()) / 3600000) : 999,
      );
    const amount = Math.round(booking.total * (pct / 100));
    setAvail((current) => ({ ...current, [booking.tourId]: (current[booking.tourId] ?? 0) + booking.seats }));
    setBookings((bs) => bs.map((b) => (b.ref === ref ? { ...b, state: 'cancelled', refundPct: pct, refundAmount: amount, cancelReason: reason } : b)));
    return { pct, amount };
  };

  const value = {
    avail,
    lock,
    paymentState,
    bookings,
    requests,
    groups,
    startLock,
    setGuests,
    applyPromo,
    chooseMethod,
    beginCapture,
    expireLock,
    clearLock,
    totalsFor,
    resolvePayment,
    forceOutcome,
    createRequest,
    acceptRequest,
    declineRequest,
    startGroupSplit,
    payShare,
    lapseGroup,
    cancelBooking,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}
