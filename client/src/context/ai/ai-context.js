import { createContext } from 'react';
import { TOURS } from '../../data/traveler/tours';

export const AiContext = createContext(null);

// §6 planner field ranges/options.
export const ORIGINS = ['Islamabad', 'Lahore', 'Karachi', 'Peshawar', 'Multan', 'Quetta'];
export const INTERESTS = ['Mountains', 'Lakes', 'Culture', 'Wildlife', 'Coastal', 'Adventure', 'Food', 'Photography'];
export const PACE_OPTIONS = [
  { id: 'relaxed', label: 'Relaxed' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'packed', label: 'Packed' },
];
export const DAYS_MIN = 2;
export const DAYS_MAX = 21;
export const BUDGET_MIN = 25000;
export const BUDGET_MAX = 300000;
export const BUDGET_STEP = 5000;
export const PLANNER_DEFAULTS = { origin: 'Islamabad', days: 5, budget: 100000, travellers: 2, pace: 'balanced' };

// §6 chatbot — minimal tool set scoped directly from the wireframe's own
// concrete example.
export const TOOL_NAMES = ['getBooking', 'getForecast', 'getRoadStatus', 'searchListings', 'escalateToHuman'];

export const ESCALATE_MONEY_KEYWORDS = ['refund', 'charge', 'charged', 'payout', 'overcharge', 'money back', 'billed'];
export const ESCALATE_SAFETY_KEYWORDS = ['weather', 'road', 'medical', 'emergency', 'avalanche', 'injur', 'unsafe', 'flood', 'closed pass'];
export const BOOKING_REF_RE = /SFR-\d{4}-\d{4}-\d{4}/i;

// §3 escalation scoping — what a human agent is handed vs. what stays out of
// reach. The wireframe's own `ai/escalation` screen lists a 4th excluded item
// ("saved cards") that this file's original 3-item list didn't carry — this
// is the one place it's now defined, reused by every escalation call site
// (sendChatMessage, escalateNow) and by the Escalation screen itself, so the
// inline chat tool-call block and the dedicated screen can never drift.
export const EXCLUDED_FROM_AGENT = ['CNIC', 'card number', 'other bookings', 'saved cards'];

// Builds the exact scoped-context object §3 specifies a human agent gets
// handed on escalation (booking ref+state, operator name, payment
// method+status) — a pure function of `bookings` so every escalation call
// site (and the dedicated `ai/escalation` screen reading it back) computes
// the identical object, never a second hand-rolled copy that could drift.
export function buildScopedContext(bookings, reason) {
  const latestBooking = bookings[bookings.length - 1];
  const tour = latestBooking ? TOURS.find((t) => t.id === latestBooking.tourId) : null;
  return {
    reason,
    bookingRef: latestBooking?.ref || null,
    bookingState: latestBooking?.state || null,
    operatorName: tour?.operator || null,
    paymentMethodStatus: latestBooking ? `${latestBooking.method || 'n/a'} · ${latestBooking.state}` : 'no active booking',
  };
}

// §3 geofence permission — exactly 4 states, `denied` first-class (never
// auto-re-prompted).
export const GEOFENCE_STATES = ['prompt', 'granted', 'denied', 'unavailable'];

// §3 weather override flow: `alert issued → operator notified → operator
// decides within policy.weatherDecisionHours (proceed | postpone | cancel) →
// no decision = auto-postpone`. `status` is the past-tense result of a
// `decision`; `auto-postponed` is reachable only via the countdown expiring,
// never a direct operator choice.
export const WEATHER_DECISIONS = ['proceed', 'postpone', 'cancel'];
export const WEATHER_DECISION_STATUS = { proceed: 'proceeded', postpone: 'postponed', cancel: 'cancelled' };

// Demo alerts. `wa-1` is deliberately tied to a real, still-untouched
// VendorContext ledger row (`LG-4003` — `LG-4002`/`LG-4004` are already used
// by the admin fraud/dispute demos) and the one seeded real BookingContext
// booking (`SFR-2026-0814-5521`, see `BookingContext.jsx`), so a `cancel`
// decision here runs the actual shared `cancelBooking` + `reverseLedger`
// pair, not a mock. `wa-2` has no linked booking/ledger row on purpose — it
// exists to demo `proceed`/`postpone`/auto-postpone without touching money.
export const WEATHER_ALERTS = [
  {
    id: 'wa-1',
    tourId: 'kkh',
    tourTitle: 'Karakoram Highway to Khunjerab — 6 days',
    landmarkId: 'khunjerab-pass',
    linkedBookingRef: 'SFR-2026-0814-5521',
    linkedLedgerId: 'LG-4003',
    condition: 'Heavy snowfall forecast over Khunjerab Pass in the next 48 hours — the pass has a real history of early-season closures.',
  },
  {
    id: 'wa-2',
    tourId: 'deosai',
    tourTitle: 'Deosai Plains camping — 3 days',
    landmarkId: 'deosai-sheosar',
    linkedBookingRef: null,
    linkedLedgerId: null,
    condition: 'A sudden cold front is forecast to bring overnight temperatures well below the seasonal norm on the plateau.',
  },
];

// §6 08-ai `isTracking` (a live in-trip location screen — NOT the same thing
// as `shop/tracking`'s gear-parcel courier tracking, a genuinely separate
// concept the wireframe just happens to name similarly). Tied to the second
// seeded `BookingContext` booking (`SFR-2026-0801-2210`, the Hunza & Attabad
// Lake trip — matching `VendorContext.SEED_LEDGER`'s still-untouched
// `LG-4001` row, same "reuse a real seam instead of a disconnected demo
// booking" pattern `WEATHER_ALERTS` above already established). That
// booking's `departureAt` is fixed 2 days in the past against a 5-day tour,
// putting "today" on day 3 — matching the wireframe's own literal example
// text ("Live · Hunza & Attabad, day 3") exactly, not a coincidence.
export const TRACK_BOOKING_REF = 'SFR-2026-0801-2210';

export const TRACK_STATS = (booking) => [
  { k: 'Day', v: '3 of 5' },
  { k: 'Elevation', v: '~2,500 m' },
  { k: 'Distance today', v: '14 km' },
  { k: 'Group size', v: `${booking?.seats ?? '—'} traveller${booking?.seats === 1 ? '' : 's'}` },
];

// `dot: 'signal-lost'` on the last leg is the real, deterministic condition
// the honest "signal drops here" copy below is keyed off — not decorative
// filler always rendered regardless of data. Hussaini bridge is the same
// crossing point `data/ai/landmarks.js`'s `hunza-attabad` entry already
// describes ("Boats cross to the Hussaini suspension bridge") — the route
// isn't invented fresh for this screen.
export const TRACK_LEGS = [
  { title: 'Karimabad', detail: 'Departed the guesthouse', at: '07:40', dot: 'done' },
  { title: 'Attabad Lake viewpoint', detail: 'Boat crossing, group photo stop', at: '10:15', dot: 'done' },
  { title: 'Hussaini suspension bridge', detail: 'Last confirmed position', at: '12:05', dot: 'signal-lost' },
  { title: 'Passu cones', detail: 'Next stop — ETA not confirmed while signal is down', at: '—', dot: 'upcoming' },
];

// "Who can see this" — real interactive toggle state in `AiContext`
// (`trackShares`/`toggleTrackShare`), seeded here. `operator` and
// `emergency` default on (a live safety-relevant default, same spirit as §3
// money/safety notification classes being non-optional at signup);
// `companions` defaults off since sharing with fellow travellers is a
// preference, not a safety default.
export const TRACK_SHARES_SEED = [
  { id: 'operator', label: 'Karakoram Expeditions (your operator)', note: 'Sees your live position while this trip is active.', on: true },
  { id: 'emergency', label: 'Emergency contact — Zara (sister)', note: 'Notified only if you check in or the trip flags a problem.', on: true },
  { id: 'companions', label: 'Trip companions', note: 'Other travellers on this same booking.', on: false },
];
