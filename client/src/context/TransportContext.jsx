import { useRef, useState } from 'react';
import { TransportContext } from './transport-context';
import {
  SEED_VEHICLES, SEED_PERMITS, SEED_ROUTES, SEED_ROOMS, SEED_MENU, SEED_LEADS,
  LEAD_WINDOW_HOURS, roomRate,
} from './transport-context';
import { DECLINE_CARD, FRAUD_CARD, FRAUD_AMOUNT_THRESHOLD, refFor } from './booking-context';

const FAIL_ROOM_REASONS = {
  failed: 'Your card was declined by the issuing bank. Nothing was charged.',
  held: 'Score above the review threshold — a human checks this within the hour.',
  'sold-out': 'This room was booked by someone else moments ago. Nothing was charged.',
};

// Transport-owner and property-owner data live in one context — both are
// module 05 in CLAUDE.md's IA table, share the route prefix `/transport/*`,
// and share the same lead lifecycle (quotes vs enquiries are the same shape,
// just a different `kind`). Splitting them would mean duplicating that
// lifecycle logic for no real benefit, since only one role is ever "active"
// on this single demo account at a time (§7 role-switcher).
export function TransportProvider({ children }) {
  const [vehicles, setVehicles] = useState(SEED_VEHICLES);
  const [permits, setPermits] = useState(SEED_PERMITS);
  const [routes, setRoutes] = useState(SEED_ROUTES);
  const [rooms, setRooms] = useState(SEED_ROOMS);
  const [menu, setMenu] = useState(SEED_MENU);
  const [leads, setLeads] = useState(SEED_LEADS);
  const [featured, setFeatured] = useState(null);
  const [roomBookings, setRoomBookings] = useState([]);

  const nextId = useRef(1);
  const genId = (prefix) => `${prefix}${nextId.current++}`;

  // --- vehicles & permits -------------------------------------------------
  const addVehicle = (v) => {
    const id = genId('v');
    setVehicles((vs) => vs.concat({ id, active: true, needsPermit: false, permitId: null, ...v }));
    return id;
  };
  const toggleVehicleActive = (id) =>
    setVehicles((vs) => vs.map((v) => (v.id === id ? { ...v, active: !v.active } : v)));

  const addPermit = (p) => {
    const id = genId('p');
    setPermits((ps) => ps.concat({ id, ...p }));
    return id;
  };
  const renewPermit = (id) =>
    setPermits((ps) => ps.map((p) => (p.id === id ? { ...p, daysLeft: 365 } : p)));

  // --- routes (pricing sheets — no inventory, §6) -------------------------
  const addRoute = (r) => {
    const id = genId('r');
    setRoutes((rs) => rs.concat({ id, ...r }));
    return id;
  };

  // --- rooms (hard floor at booked count, same pattern as vendor availability) --
  const addRoom = (r) => {
    const id = genId('rm');
    setRooms((rs) => rs.concat({ id, booked: 0, ...r }));
    return id;
  };
  const setRoomTotal = (id, total) => {
    let refused = null;
    setRooms((rs) => rs.map((r) => {
      if (r.id !== id) return r;
      if (total < r.booked) { refused = r.booked; return r; }
      return { ...r, total };
    }));
    return refused === null ? { ok: true } : { ok: false, floor: refused };
  };

  // Traveller-facing: "Rooms are booked" (§6 property) — unlike an enquiry,
  // this takes payment and reduces availability, so it runs through the same
  // card/amount rules as the tour and gear checkouts (§3: one shared
  // payment/webhook shape) before the atomic floor check. One call rather
  // than BookingContext's separate lock+resolve, since nothing here needs a
  // display countdown — there's no soft-lock requirement documented for a
  // room the way there is for a tour seat.
  const bookRoom = ({ roomId, checkIn, nights, guests, method, methodDetail, guestName }) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return { kind: 'sold-out', reason: FAIL_ROOM_REASONS['sold-out'] };

    const rate = roomRate(room.nightlyRate, checkIn);
    const total = rate * nights;
    const digits = (methodDetail || '').replace(/\D/g, '');

    if (method === 'card' && digits === DECLINE_CARD) return { kind: 'failed', reason: FAIL_ROOM_REASONS.failed };
    if (method === 'card' && digits === FRAUD_CARD) return { kind: 'held', reason: FAIL_ROOM_REASONS.held };
    if ((method === 'jazzcash' || method === 'easypaisa') && digits.endsWith('0000')) {
      return { kind: 'failed', reason: `${method === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'} declined the charge. Nothing was captured.` };
    }
    if (total >= FRAUD_AMOUNT_THRESHOLD) {
      return { kind: 'held', reason: `Rs ${total.toLocaleString('en-US')} is well above a typical first reservation — held for a human review.` };
    }
    if (room.booked >= room.total) return { kind: 'sold-out', reason: FAIL_ROOM_REASONS['sold-out'] };

    const ref = refFor('SFR');
    setRooms((rs) => rs.map((r) => (r.id === roomId ? { ...r, booked: r.booked + 1 } : r)));
    setRoomBookings((bs) => bs.concat({
      ref, roomId, roomName: room.name, checkIn, nights, guests, rate, total, method,
      guestName: guestName || 'Traveller', state: 'confirmed', at: Date.now(),
    }));
    return { kind: 'confirmed', ref, total };
  };

  const cancelRoomBooking = (ref) => {
    const booking = roomBookings.find((b) => b.ref === ref);
    if (!booking || booking.state !== 'confirmed') return null;
    setRooms((rs) => rs.map((r) => (r.id === booking.roomId ? { ...r, booked: Math.max(0, r.booked - 1) } : r)));
    setRoomBookings((bs) => bs.map((b) => (b.ref === ref ? { ...b, state: 'cancelled' } : b)));
    return true;
  };

  // --- menu ----------------------------------------------------------------
  const addMenuItem = (m) => {
    const id = genId('mn');
    setMenu((ms) => ms.concat({ id, on: true, ...m }));
    return id;
  };
  const toggleMenuItem = (id) =>
    setMenu((ms) => ms.map((m) => (m.id === id ? { ...m, on: !m.on } : m)));

  // --- leads (quotes + enquiries, shared shape) ---------------------------
  // Traveller-facing action — called from Transport.jsx / PropertyDetail.jsx.
  const createLead = ({ kind, subjectId, subjectLabel, name, date, count, note }) => {
    const id = genId('ld');
    setLeads((ls) => ls.concat({
      id, kind, subjectId, subjectLabel, name, date, count, note: note || '',
      status: 'request', createdAt: Date.now(), deadlineAt: Date.now() + LEAD_WINDOW_HOURS * 3600000, quote: null,
    }));
    return id;
  };

  const sendQuote = (id, { lineItems, expiryHours }) => {
    const total = lineItems.reduce((n, li) => n + li.amount, 0);
    setLeads((ls) => ls.map((l) => (l.id === id
      ? { ...l, status: 'quoted', quote: { lineItems, total, expiryHours, quotedAt: Date.now(), expiresAt: Date.now() + expiryHours * 3600000 } }
      : l)));
  };

  // No reason required to decline a lead here — unlike the vendor booking
  // decline (§6 quotes inbox note: this is a deliberate, spec-called-out
  // difference from module 04's fixed-reason decline).
  const declineLead = (id) =>
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status: 'declined' } : l)));

  const withdrawQuote = (id) =>
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status: 'withdrawn' } : l)));

  // No live traveller-side "accept a quote" screen exists yet (out of scope
  // for this pass — see the module 05 build-order note), so this is the same
  // honestly-labeled testing lever as module 02's force-outcome panel and
  // module 03's KYC preview links, not hidden magic.
  const previewLeadOutcome = (id, status) =>
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)));

  // Traveller-facing: the real "quoted → accepted" transition (§3 lead
  // lifecycle) — reachable from `discover/enquiries` now that that screen
  // exists, not just the preview lever above. A lead/quote is its own record
  // of what was agreed (§4's suggested `Quote`/`Lead` collection), so
  // accepting it doesn't need a second Booking document — same "no parallel
  // path" spirit as `reverseLedger` being the one refund mechanism (§3).
  const acceptLead = (id) =>
    setLeads((ls) => ls.map((l) => (l.id === id && l.status === 'quoted' ? { ...l, status: 'accepted', acceptedAt: Date.now() } : l)));

  // --- featured placement (§6) ---------------------------------------------
  const buyFeatured = ({ region, days, perDay }) => {
    setFeatured({ region, days, cost: perDay * days, startedAt: Date.now() });
  };

  const value = {
    vehicles, addVehicle, toggleVehicleActive,
    permits, addPermit, renewPermit,
    routes, addRoute,
    rooms, addRoom, setRoomTotal, bookRoom, roomBookings, cancelRoomBooking,
    menu, addMenuItem, toggleMenuItem,
    leads, createLead, sendQuote, declineLead, withdrawQuote, previewLeadOutcome, acceptLead,
    featured, buyFeatured,
  };

  return <TransportContext.Provider value={value}>{children}</TransportContext.Provider>;
}
