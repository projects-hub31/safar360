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
