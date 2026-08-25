import { createContext } from 'react';

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
