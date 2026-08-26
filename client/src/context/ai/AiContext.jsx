import { useCallback, useMemo, useRef, useState } from 'react';
import { AiContext } from './ai-context';
import {
  ESCALATE_MONEY_KEYWORDS, ESCALATE_SAFETY_KEYWORDS, BOOKING_REF_RE,
  WEATHER_ALERTS, WEATHER_DECISION_STATUS,
  EXCLUDED_FROM_AGENT, buildScopedContext, TRACK_SHARES_SEED,
} from './ai-context';
import { TOURS } from '../../data/traveler/tours';
import { useBooking } from '../booking/useBooking';
import { useVendor } from '../vendor/useVendor';

// Now cross-referenced to `data/ai/landmarks.js`'s hand-curated collection
// via `landmarkId` (§3: landmarks are their own collection, not duplicated
// ad hoc place-name strings) rather than the two staying silently parallel.
const FORECASTS = {
  hunza: { landmarkId: 'hunza-attabad', tempC: 14, condition: 'Partly cloudy', windKmh: 18 },
  skardu: { landmarkId: 'deosai-sheosar', tempC: 9, condition: 'Clear', windKmh: 12 },
  deosai: { landmarkId: 'deosai-sheosar', tempC: 2, condition: 'Snow risk overnight', windKmh: 35 },
  fairy: { landmarkId: 'fairy-meadows', tempC: 6, condition: 'Clear, cold mornings', windKmh: 14 },
};
const ROADS = {
  khunjerab: { landmarkId: 'khunjerab-pass', status: 'open', note: 'Open, normal border-crossing hours.' },
  babusar: { landmarkId: null, status: 'open', note: 'Open, light snow possible this weekend.' },
  fairymeadows: { landmarkId: 'fairy-meadows', status: 'jeep-only', note: 'Jeep track open to Tato; foot from there as usual.' },
};

function scoreInterest(tour, interests) {
  if (!interests.length) return 0;
  const hay = `${tour.title} ${tour.meta} ${tour.region}`.toLowerCase();
  return interests.reduce((n, kw) => n + (hay.includes(kw.toLowerCase()) ? 1 : 0), 0);
}

function findForecastKey(text) {
  return Object.keys(FORECASTS).find((k) => text.toLowerCase().includes(k)) || null;
}
function findRoadKey(text) {
  return Object.keys(ROADS).find((k) => text.toLowerCase().replace(/\s+/g, '').includes(k)) || null;
}

export function AiProvider({ children }) {
  const { avail, bookings, cancelBooking } = useBooking();
  // VendorProvider is an ancestor of AiProvider in main.jsx's tree, so this
  // is available here — the weather-cancel flow can call the real, shared
  // `reverseLedger` directly rather than needing a page to broker it.
  const { reverseLedger } = useVendor();

  const [currentItinerary, setCurrentItinerary] = useState(null);
  const [saved, setSaved] = useState([]);
  const [messages, setMessages] = useState(() => [
    { id: 'b0', role: 'assistant', text: 'Ask me about a booking, weather on a route, road status, or trip ideas. Anything about money or safety goes straight to a person.', toolCalls: [], escalate: null, at: Date.now() },
  ]);
  const [failStreak, setFailStreak] = useState(0);

  // --- landmarks / geofence (§3) ---------------------------------------------
  // `geofence`: { [landmarkId]: 'prompt' | 'granted' | 'denied' | 'unavailable' }
  // `checkIns`: { [landmarkId]: { at, notifiedContact } } — marks a mapped
  // point (and, transitively, any itinerary day booking that same tour) as
  // reached. No public-post effect exists at all here, by design (§3: "never
  // posts publicly by default" — satisfied by simply not offering that
  // control, not a flag defaulted off).
  const [geofence, setGeofence] = useState({});
  const [checkIns, setCheckIns] = useState({});

  const setGeofenceState = useCallback((landmarkId, state) => {
    setGeofence((g) => ({ ...g, [landmarkId]: state }));
  }, []);

  const checkIn = useCallback((landmarkId, { notifyContact = false } = {}) => {
    setCheckIns((c) => ({ ...c, [landmarkId]: { at: Date.now(), notifiedContact: notifyContact } }));
  }, []);

  // --- live in-trip tracking (§6 08-ai isTracking) ---------------------------
  // "Who can see this" toggle state — real, not decorative. `trackLastPingAt`
  // is a lazy initializer (allowed one Date.now() call, per the same
  // react-hooks/purity-safe pattern `weatherAlerts` below already uses) fixed
  // ~50 minutes in the past so the Tracking screen's "last known point" honest
  // copy has something genuinely stale to report, matching the deliberate
  // signal-lost leg in `TRACK_LEGS`.
  const [trackShares, setTrackShares] = useState(TRACK_SHARES_SEED);
  const [trackLastPingAt] = useState(() => Date.now() - 47 * 60000);

  const toggleTrackShare = useCallback((id) => {
    setTrackShares((ts) => ts.map((t) => (t.id === id ? { ...t, on: !t.on } : t)));
  }, []);

  // --- weather override flow (§3) --------------------------------------------
  // A lazy initializer (allowed to call Date.now() once, per the react-hooks
  // purity rule this codebase enforces elsewhere) rather than a static seed
  // constant carrying a stale build-time timestamp.
  const [weatherAlerts, setWeatherAlerts] = useState(() => WEATHER_ALERTS.map((a) => ({
    ...a, status: 'pending', decision: null, issuedAt: Date.now(), decidedAt: null, refundResult: null,
  })));

  // `refundPct` is supplied by the caller (the Weather screen reads
  // `policy.weatherRefundPct` live from AdminContext, which this provider has
  // no access to — Admin nests *inside* Ai in main.jsx's tree, not outside
  // it) — this keeps the live-policy read at the page level while the actual
  // money-moving mutation stays here, calling the same ordinary
  // `cancelBooking`/`reverseLedger` actions every other cancellation flow
  // uses. No parallel weather-refund code path.
  const decideWeatherAlert = useCallback((alertId, decision, { refundPct } = {}) => {
    const alert = weatherAlerts.find((a) => a.id === alertId);
    if (!alert || alert.status !== 'pending') return null;
    let result = null;
    if (decision === 'cancel' && alert.linkedBookingRef) {
      result = cancelBooking(alert.linkedBookingRef, 'weather', refundPct);
      if (alert.linkedLedgerId) reverseLedger(alert.linkedLedgerId);
    }
    setWeatherAlerts((alerts) => alerts.map((a) => (a.id === alertId
      ? { ...a, status: WEATHER_DECISION_STATUS[decision], decision, decidedAt: Date.now(), refundResult: result }
      : a)));
    return result;
  }, [weatherAlerts, cancelBooking, reverseLedger]);

  // Countdown's own `onExpire` fires this — "no decision = auto-postpone"
  // (§3) is a real timeout, not an operator choice, so it's a distinct status
  // rather than routed through `decideWeatherAlert`'s decision map.
  const autoPostponeAlert = useCallback((alertId) => {
    setWeatherAlerts((alerts) => alerts.map((a) => (a.id === alertId && a.status === 'pending'
      ? { ...a, status: 'auto-postponed', decision: null, decidedAt: Date.now() }
      : a)));
  }, []);

  const nextId = useRef(1);
  const genId = useCallback((prefix) => `${prefix}${nextId.current++}`, []);

  // --- planner: builds a real day-by-day plan against the live catalog ------
  // The screen literally shows this payload as a transparency device (§6
  // planner: "shows the constructed API call `POST /ai/plan-trip {...}`").
  const planTrip = useCallback(({ origin, days, budget, travellers, interests, pace }) => {
    const candidates = TOURS
      .filter((t) => t.price * travellers <= budget)
      .sort((a, b) => scoreInterest(b, interests) - scoreInterest(a, interests) || b.rating - a.rating);

    const items = [];
    const usedRegions = new Set();
    let dayCursor = 0;
    for (const t of candidates) {
      if (dayCursor >= days) break;
      if (usedRegions.has(t.region) && usedRegions.size < candidates.length) continue;
      const span = Math.min(t.days, days - dayCursor);
      if (span < 1) continue;
      items.push({ tourId: t.id, startDay: dayCursor + 1, span, priceAtPlan: t.price });
      usedRegions.add(t.region);
      dayCursor += span;
    }

    const itinerary = {
      id: genId('it'),
      origin, days, budget, travellers, interests, pace,
      items,
      gapDays: Math.max(0, days - dayCursor),
      requestPayload: { origin, days, budget, travellers, interests },
      createdAt: Date.now(),
    };
    setCurrentItinerary(itinerary);
    return itinerary;
  }, [genId]);

  // Re-costs against the CURRENT catalog + live seat pool, exactly what the
  // "saved" screen is required to do (§6 saved: "Re-costs on open and
  // surfaces a price-delta explanation if a rate changed since saving").
  const recostItinerary = useCallback((itinerary) => {
    let savedTotal = 0;
    let currentTotal = 0;
    const lines = itinerary.items.map((it) => {
      const tour = TOURS.find((t) => t.id === it.tourId);
      const stillBookable = tour && (avail[it.tourId] ?? 0) > 0;
      savedTotal += it.priceAtPlan * itinerary.travellers;
      if (stillBookable) currentTotal += tour.price * itinerary.travellers;
      return { ...it, tour, stillBookable };
    });
    return { lines, savedTotal, currentTotal, delta: currentTotal - savedTotal };
  }, [avail]);

  const saveItinerary = useCallback((itinerary) => {
    setSaved((s) => s.concat({ ...itinerary, savedAt: Date.now() }));
  }, []);

  // --- chatbot ---------------------------------------------------------------
  // Every tool call renders as its own visible block (name/args/result),
  // never folded silently into the prose reply (§3 chatbot transparency).
  const sendChatMessage = useCallback((text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((m) => m.concat({ id: genId('u'), role: 'user', text: trimmed, toolCalls: [], escalate: null, at: Date.now() }));

    const lower = trimmed.toLowerCase();
    const toolCalls = [];
    let reply = null;
    let escalate = null;

    if (ESCALATE_MONEY_KEYWORDS.some((k) => lower.includes(k))) {
      escalate = 'money';
      reply = 'Refunds, charges and payouts are never something I confirm myself — connecting you to a person who can see the real transaction.';
    } else if (ESCALATE_SAFETY_KEYWORDS.some((k) => lower.includes(k))) {
      const roadKey = findRoadKey(lower);
      const forecastKey = findForecastKey(lower);
      if (roadKey) {
        toolCalls.push({ name: 'getRoadStatus', args: { route: roadKey }, result: { found: true, ...ROADS[roadKey] } });
      } else if (forecastKey) {
        toolCalls.push({ name: 'getForecast', args: { place: forecastKey }, result: { found: true, ...FORECASTS[forecastKey] } });
      } else {
        toolCalls.push({ name: 'getForecast', args: { place: lower.slice(0, 24) }, result: { found: false, note: 'No live data for this location — uncertain, not guessing.' } });
      }
      escalate = 'safety';
      reply = 'Safety questions are never answered by a model alone. Here is what the data shows above — a person is taking it from here.';
    } else if (BOOKING_REF_RE.test(trimmed)) {
      const ref = trimmed.match(BOOKING_REF_RE)[0].toUpperCase();
      const found = bookings.find((b) => b.ref === ref);
      toolCalls.push({ name: 'getBooking', args: { ref }, result: found ? { found: true, title: found.title, state: found.state, seats: found.seats } : { found: false } });
      reply = found ? `${ref} — ${found.title}, currently ${found.state}.` : `I couldn't find a booking with reference ${ref}. Check the reference on your e-ticket.`;
    } else if (/(find|recommend|search|trip to|suggest)/.test(lower)) {
      const matches = TOURS.filter((t) => `${t.title} ${t.region} ${t.meta}`.toLowerCase().includes(lower.replace(/(find|recommend|search|trip to|suggest|a|me|for)/g, '').trim())).slice(0, 3);
      toolCalls.push({ name: 'searchListings', args: { query: trimmed }, result: { count: matches.length, results: matches.map((t) => ({ id: t.id, title: t.title, price: t.price })) } });
      reply = matches.length ? `Found ${matches.length} matching trip${matches.length === 1 ? '' : 's'} — see the tool result above.` : 'Nothing matched that — try naming a region or an activity instead.';
    }

    const nextFailStreak = reply === null ? failStreak + 1 : 0;
    setFailStreak(nextFailStreak);
    if (reply === null) {
      if (nextFailStreak >= 2) {
        escalate = 'repeated';
        reply = "I'm not landing on an answer after a couple of tries — connecting you to a person instead of guessing.";
      } else {
        reply = "I'm not sure I understood that. Try asking about a booking reference, weather or road status on a route, or trip ideas.";
      }
    }

    if (escalate) {
      toolCalls.push({
        name: 'escalateToHuman',
        args: { reason: escalate },
        result: {
          scopedContext: { ...buildScopedContext(bookings, escalate), transcriptTurns: messages.length },
          excluded: EXCLUDED_FROM_AGENT,
        },
      });
    }

    setMessages((m) => m.concat({ id: genId('b'), role: 'assistant', text: reply, toolCalls, escalate, at: Date.now() }));
    return { escalate };
  }, [bookings, failStreak, messages, genId]);

  // User-initiated escalation — the control is always visible, never buried
  // behind a failed answer (§3 chatbot escalation), so this always connects
  // immediately rather than routing through sendChatMessage's keyword/fail-
  // streak classifier.
  const escalateNow = useCallback(() => {
    setMessages((m) => m.concat({
      id: genId('u'), role: 'user', text: 'Talk to a person.', toolCalls: [], escalate: null, at: Date.now(),
    }, {
      id: genId('b'), role: 'assistant', text: "Connecting you to a person now.", escalate: 'user', at: Date.now(),
      toolCalls: [{
        name: 'escalateToHuman',
        args: { reason: 'user' },
        result: {
          scopedContext: { ...buildScopedContext(bookings, 'user'), transcriptTurns: messages.length },
          excluded: EXCLUDED_FROM_AGENT,
        },
      }],
    }));
    setFailStreak(0);
  }, [bookings, messages, genId]);

  const value = useMemo(() => ({
    currentItinerary, saved, messages,
    planTrip, recostItinerary, saveItinerary,
    sendChatMessage, escalateNow,
    geofence, setGeofenceState, checkIns, checkIn,
    weatherAlerts, decideWeatherAlert, autoPostponeAlert,
    trackShares, toggleTrackShare, trackLastPingAt,
  }), [
    currentItinerary, saved, messages,
    planTrip, recostItinerary, saveItinerary,
    sendChatMessage, escalateNow,
    geofence, setGeofenceState, checkIns, checkIn,
    weatherAlerts, decideWeatherAlert, autoPostponeAlert,
    trackShares, toggleTrackShare, trackLastPingAt,
  ]);

  return <AiContext.Provider value={value}>{children}</AiContext.Provider>;
}
