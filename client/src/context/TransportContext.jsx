import { useRef, useState } from 'react';
import { TransportContext } from './transport-context';
import {
  SEED_VEHICLES, SEED_PERMITS, SEED_ROUTES, SEED_ROOMS, SEED_MENU, SEED_LEADS,
  LEAD_WINDOW_HOURS,
} from './transport-context';

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

  // --- featured placement (§6) ---------------------------------------------
  const buyFeatured = ({ region, days, perDay }) => {
    setFeatured({ region, days, cost: perDay * days, startedAt: Date.now() });
  };

  const value = {
    vehicles, addVehicle, toggleVehicleActive,
    permits, addPermit, renewPermit,
    routes, addRoute,
    rooms, addRoom, setRoomTotal,
    menu, addMenuItem, toggleMenuItem,
    leads, createLead, sendQuote, declineLead, withdrawQuote, previewLeadOutcome,
    featured, buyFeatured,
  };

  return <TransportContext.Provider value={value}>{children}</TransportContext.Provider>;
}
