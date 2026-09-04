import { useCallback, useMemo, useState } from 'react';
import { TransportContext } from './transport-context';
import { api } from '../../utils/api';

// Transport-owner and property-owner data live in one context — both are
// module 05 in CLAUDE.md's IA table, share the route prefix `/api/transport`,
// and share the same real lead lifecycle (quotes vs enquiries are the same
// shape, just a different `kind`) — verified end-to-end, CLAUDE.md §9.
//
// `vehicles`/`rooms` are shared slots between two different real sources:
// the owner's own CRUD (`fetchVehicles`/`fetchRooms`, requireRole('transport'
// /'property')) and the public discover feed a traveller browses
// (`fetchDiscoverVehicles`/`fetchDiscoverRooms`) — only one is ever "active"
// per screen, matching the single-demo-account pattern every other module
// uses. `discoverPropertyOwnerId` is what a traveller's table/group enquiry
// actually targets, since a property enquiry has no vehicle-like subject to
// resolve an owner from server-side the way a transport lead does.
// `featured` stays local-only mock — no real backend for it exists or was
// ever planned for this pass (CLAUDE.md §9 days 8-9 doesn't mention it).
export function TransportProvider({ children }) {
  const [vehicles, setVehicles] = useState([]);
  const [permits, setPermits] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [discoverPropertyOwnerId, setDiscoverPropertyOwnerId] = useState(null);
  const [menu, setMenu] = useState([]);
  const [leads, setLeads] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [roomBookings, setRoomBookings] = useState([]);

  const mapLead = useCallback((l) => ({
    id: l.id,
    kind: l.kind,
    subjectId: l.subjectId,
    subjectLabel: l.subjectLabel,
    name: l.name,
    date: l.date,
    count: l.count,
    note: l.note,
    status: l.status,
    createdAt: new Date(l.createdAt).getTime(),
    deadlineAt: l.deadlineAt ? new Date(l.deadlineAt).getTime() : null,
    quote: l.quote ? {
      lineItems: l.quote.lineItems,
      total: l.quote.total,
      expiryHours: l.quote.expiryHours,
      quotedAt: new Date(l.quote.quotedAt).getTime(),
      expiresAt: new Date(l.quote.expiresAt).getTime(),
    } : null,
    acceptedAt: l.acceptedAt ? new Date(l.acceptedAt).getTime() : null,
  }), []);

  const mapRoomBooking = useCallback((b) => ({
    ref: b.ref,
    roomId: b.roomId,
    roomName: b.roomName,
    checkIn: new Date(b.checkIn).toISOString().slice(0, 10),
    nights: b.nights,
    guests: b.guests,
    rate: b.rate,
    total: b.total,
    method: b.method,
    guestName: b.guestName,
    state: b.state,
    at: new Date(b.at).getTime(),
  }), []);

  // --- vehicles & permits (transport owner) -------------------------------
  const fetchVehicles = useCallback(async () => {
    const res = await api.get('/transport/vehicles');
    if (res.ok) setVehicles(res.data);
  }, []);

  // Public discover feed — a traveller enquiring needs a real vehicle id,
  // same "bridge the single demo entity to a real backend id" shape as
  // TourDetail's own slug bridge.
  const fetchDiscoverVehicles = useCallback(async () => {
    const res = await api.get('/discover/vehicles');
    if (res.ok) setVehicles(res.data);
  }, []);

  const addVehicle = useCallback(async (v) => {
    const res = await api.post('/transport/vehicles', v);
    if (res.ok) setVehicles((vs) => vs.concat(res.data));
    return res.ok ? res.data.id : null;
  }, []);

  const toggleVehicleActive = useCallback((id) => {
    setVehicles((vs) => {
      const vehicle = vs.find((v) => v.id === id);
      if (vehicle) {
        api.patch(`/transport/vehicles/${id}`, { active: !vehicle.active }).then((res) => {
          if (res.ok) setVehicles((current) => current.map((v) => (v.id === id ? res.data : v)));
        });
      }
      return vs;
    });
  }, []);

  const fetchPermits = useCallback(async () => {
    const res = await api.get('/transport/permits');
    if (res.ok) setPermits(res.data);
  }, []);

  const addPermit = useCallback(async (p) => {
    const res = await api.post('/transport/permits', p);
    if (!res.ok) return null;
    setPermits((ps) => ps.concat(res.data));
    // Linking a permit flips the vehicle's own needsPermit/permitId
    // server-side (permits.controller.js) — refresh so Vehicles.jsx's
    // "visible in search" preview reflects it immediately.
    fetchVehicles();
    return res.data.id;
  }, [fetchVehicles]);

  const renewPermit = useCallback(async (id) => {
    const res = await api.post(`/transport/permits/${id}/renew`);
    if (res.ok) setPermits((ps) => ps.map((p) => (p.id === id ? res.data : p)));
  }, []);

  // --- routes (pricing sheets — no inventory, §6) -------------------------
  const fetchRoutes = useCallback(async () => {
    const res = await api.get('/transport/routes');
    if (res.ok) setRoutes(res.data);
  }, []);

  const addRoute = useCallback(async (r) => {
    const res = await api.post('/transport/routes', r);
    if (res.ok) setRoutes((rs) => rs.concat(res.data));
    return res.ok ? res.data.id : null;
  }, []);

  // --- rooms (hard floor at booked count, same pattern as vendor availability) --
  const fetchRooms = useCallback(async () => {
    const res = await api.get('/transport/rooms');
    if (res.ok) setRooms(res.data);
  }, []);

  // Public discover feed — one arbitrary real property owner's rooms
  // (discover/rooms.controller.js's own note: no multi-property search this
  // pass, same single-demo-entity bridge as vehicles above). Captures
  // `ownerId` since a table/group enquiry has to target it explicitly.
  const fetchDiscoverRooms = useCallback(async () => {
    const res = await api.get('/discover/rooms');
    if (res.ok) {
      setRooms(res.data.rooms);
      setDiscoverPropertyOwnerId(res.data.ownerId);
    }
  }, []);

  const addRoom = useCallback(async (r) => {
    const res = await api.post('/transport/rooms', r);
    if (res.ok) setRooms((rs) => rs.concat(res.data));
    return res.ok ? res.data.id : null;
  }, []);

  const setRoomTotal = useCallback(async (id, total) => {
    const res = await api.patch(`/transport/rooms/${id}`, { total });
    if (!res.ok) {
      const room = rooms.find((r) => r.id === id);
      return { ok: false, floor: room?.booked };
    }
    setRooms((rs) => rs.map((r) => (r.id === id ? res.data : r)));
    return { ok: true };
  }, [rooms]);

  // Traveller-facing: real payment, real availability (§6 "Rooms are
  // booked, enquiries are not") — one call, no soft-lock (§8 module 05:
  // nothing in the source spec documents a hold requirement for a room the
  // way it does a tour seat).
  const fetchMyRoomBookings = useCallback(async () => {
    const res = await api.get('/transport/room-bookings/mine');
    if (res.ok) setRoomBookings(res.data.map(mapRoomBooking));
  }, [mapRoomBooking]);

  const bookRoom = useCallback(async ({ roomId, checkIn, nights, guests, method, methodDetail, guestName }) => {
    const res = await api.post(`/transport/rooms/${roomId}/book`, { checkIn, nights, guests, method, methodDetail, guestName });
    if (!res.ok) return { kind: 'failed', reason: res.error.message };
    if (res.data.kind === 'confirmed') {
      setRooms((rs) => rs.map((r) => (r.id === roomId ? { ...r, booked: r.booked + 1 } : r)));
      fetchMyRoomBookings();
    }
    return res.data;
  }, [fetchMyRoomBookings]);

  const cancelRoomBooking = useCallback(async (ref) => {
    const res = await api.post(`/transport/room-bookings/${ref}/cancel`);
    if (!res.ok) return null;
    const booking = roomBookings.find((b) => b.ref === ref);
    if (booking) setRooms((rs) => rs.map((r) => (r.id === booking.roomId ? { ...r, booked: Math.max(0, r.booked - 1) } : r)));
    setRoomBookings((bs) => bs.map((b) => (b.ref === ref ? { ...b, state: 'cancelled' } : b)));
    return true;
  }, [roomBookings]);

  // --- menu ----------------------------------------------------------------
  const fetchMenu = useCallback(async () => {
    const res = await api.get('/transport/menu');
    if (res.ok) setMenu(res.data);
  }, []);

  const addMenuItem = useCallback(async (m) => {
    const res = await api.post('/transport/menu', m);
    if (res.ok) setMenu((ms) => ms.concat(res.data));
    return res.ok ? res.data.id : null;
  }, []);

  const toggleMenuItem = useCallback(async (id) => {
    const res = await api.patch(`/transport/menu/${id}/toggle`);
    if (res.ok) setMenu((ms) => ms.map((m) => (m.id === id ? res.data : m)));
  }, []);

  // --- leads (quotes + enquiries, shared shape) ---------------------------
  const fetchLeadsInbox = useCallback(async () => {
    const res = await api.get('/transport/leads');
    if (res.ok) setLeads(res.data.map(mapLead));
  }, [mapLead]);

  const fetchMyLeads = useCallback(async () => {
    const res = await api.get('/transport/leads/mine');
    if (res.ok) setLeads(res.data.map(mapLead));
  }, [mapLead]);

  // Traveller-facing action — called from Transport.jsx / PropertyDetail.jsx.
  // `subjectId` (a real vehicle id) is required for kind 'transport';
  // `ownerId` (discoverPropertyOwnerId) is required for 'table'/'group'.
  const createLead = useCallback(async ({ kind, subjectId, ownerId, subjectLabel, date, count, note }) => {
    const res = await api.post('/transport/leads', { kind, subjectId, ownerId, subjectLabel, date, count, note });
    if (!res.ok) return null;
    setLeads((ls) => ls.concat(mapLead(res.data)));
    return res.data.id;
  }, [mapLead]);

  const sendQuote = useCallback(async (id, { lineItems, expiryHours }) => {
    const res = await api.post(`/transport/leads/${id}/quote`, { lineItems, expiryHours });
    if (res.ok) setLeads((ls) => ls.map((l) => (l.id === id ? mapLead(res.data) : l)));
  }, [mapLead]);

  // No reason required to decline a lead here — unlike the vendor booking
  // decline (§6 quotes inbox note: this is a deliberate, spec-called-out
  // difference from module 04's fixed-reason decline).
  const declineLead = useCallback(async (id) => {
    const res = await api.post(`/transport/leads/${id}/decline`);
    if (res.ok) setLeads((ls) => ls.map((l) => (l.id === id ? mapLead(res.data) : l)));
  }, [mapLead]);

  const withdrawQuote = useCallback(async (id) => {
    const res = await api.post(`/transport/leads/${id}/withdraw`);
    if (res.ok) setLeads((ls) => ls.map((l) => (l.id === id ? mapLead(res.data) : l)));
  }, [mapLead]);

  // Traveller-facing: the real "quoted → accepted" transition (§3 lead
  // lifecycle), reachable from `discover/enquiries`. A lead/quote is its own
  // record of what was agreed — accepting it doesn't create a second
  // Booking document, same "no parallel path" spirit as `reverseLedger`
  // being the one refund mechanism (§3).
  const acceptLead = useCallback(async (id) => {
    const res = await api.post(`/transport/leads/${id}/accept`);
    if (res.ok) setLeads((ls) => ls.map((l) => (l.id === id ? mapLead(res.data) : l)));
    return res.ok;
  }, [mapLead]);

  // --- featured placement (§6) — local-only mock, no real backend planned
  // for this pass (CLAUDE.md §9 days 8-9 scope doesn't cover it) -----------
  const buyFeatured = useCallback(({ region, days, perDay }) => {
    setFeatured({ region, days, cost: perDay * days, startedAt: Date.now() });
  }, []);

  const value = useMemo(() => ({
    vehicles, fetchVehicles, fetchDiscoverVehicles, addVehicle, toggleVehicleActive,
    permits, fetchPermits, addPermit, renewPermit,
    routes, fetchRoutes, addRoute,
    rooms, fetchRooms, fetchDiscoverRooms, discoverPropertyOwnerId, addRoom, setRoomTotal,
    bookRoom, roomBookings, fetchMyRoomBookings, cancelRoomBooking,
    menu, fetchMenu, addMenuItem, toggleMenuItem,
    leads, fetchLeadsInbox, fetchMyLeads, createLead, sendQuote, declineLead, withdrawQuote, acceptLead,
    featured, buyFeatured,
  }), [
    vehicles, fetchVehicles, fetchDiscoverVehicles, addVehicle, toggleVehicleActive,
    permits, fetchPermits, addPermit, renewPermit,
    routes, fetchRoutes, addRoute,
    rooms, fetchRooms, fetchDiscoverRooms, discoverPropertyOwnerId, addRoom, setRoomTotal,
    bookRoom, roomBookings, fetchMyRoomBookings, cancelRoomBooking,
    menu, fetchMenu, addMenuItem, toggleMenuItem,
    leads, fetchLeadsInbox, fetchMyLeads, createLead, sendQuote, declineLead, withdrawQuote, acceptLead,
    featured, buyFeatured,
  ]);

  return <TransportContext.Provider value={value}>{children}</TransportContext.Provider>;
}
