import tourHunza from '../../assets/traveler/tour-hunza.jpg';
import tourSkardu from '../../assets/traveler/tour-skardu.jpg';
import tourFairy from '../../assets/traveler/tour-fairy.jpg';
import tourKumrat from '../../assets/traveler/tour-kumrat.jpg';
import tourKkh from '../../assets/traveler/tour-kkh.jpg';
import tourDeosai from '../../assets/traveler/tour-deosai.jpg';
import tourGwadar from '../../assets/traveler/tour-gwadar.jpg';
import tourKalash from '../../assets/traveler/tour-kalash.jpg';
import tourPassu from '../../assets/traveler/tour-passu.jpg';
import tourLake from '../../assets/traveler/tour-lake.jpg';

// One tour per row — the same shape the search, home and detail screens all read.
// `bookingMode` and `cancellationPolicy` live on the listing itself, not as a
// global constant (CLAUDE.md §3 "Booking mode & cancellation policy — per
// listing, not global"): `instant` deducts seats on payment confirmation,
// `request` holds nothing until the operator accepts within 24h; cancellation
// tiers are `flexible` (full refund to 24h before) / `standard` (100% at 7d,
// 50% at 48h) / `strict` (50% until 14d, permit-heavy treks).
export const TOURS = [
  { id: 'hunza', title: 'Hunza & Attabad Lake — 5 days', img: tourHunza, alt: 'Turquoise Attabad Lake below terraced slopes', region: 'Gilgit-Baltistan', days: 5, price: 56625, rating: 4.9, reviews: 184, operator: 'Karakoram Expeditions', meta: 'Karimabad · Attabad · Passu · 5 days', badge: 'Editor’s pick', sponsored: false, bookingMode: 'instant', cancellationPolicy: 'standard' },
  { id: 'skardu', title: 'Skardu, Shangrila & Deosai — 7 days', img: tourSkardu, alt: 'Braided river valley near Skardu', region: 'Gilgit-Baltistan', days: 7, price: 84000, rating: 4.8, reviews: 132, operator: 'Baltistan Trails', meta: 'Skardu · Shangrila · Deosai plains · 7 days', badge: '', sponsored: false, bookingMode: 'instant', cancellationPolicy: 'standard' },
  { id: 'fairy', title: 'Fairy Meadows & Nanga Parbat base — 4 days', img: tourFairy, alt: 'Alpine meadow beneath a snow face', region: 'Gilgit-Baltistan', days: 4, price: 48500, rating: 4.7, reviews: 97, operator: 'Raikot Guides', meta: 'Raikot bridge · Tato jeep track · base camp · 4 days', badge: 'Hard trek', sponsored: false, bookingMode: 'request', cancellationPolicy: 'strict' },
  { id: 'kumrat', title: 'Kumrat Valley & Jahaz Banda — 3 days', img: tourKumrat, alt: 'Pine forest along a river in Kumrat', region: 'Khyber Pakhtunkhwa', days: 3, price: 31200, rating: 4.6, reviews: 211, operator: 'Dir Valley Tours', meta: 'Thal · Kumrat forest · Jahaz Banda · 3 days', badge: '', sponsored: true, bookingMode: 'instant', cancellationPolicy: 'flexible' },
  { id: 'kkh', title: 'Karakoram Highway to Khunjerab — 6 days', img: tourKkh, alt: 'Highway curving between bare mountains', region: 'Gilgit-Baltistan', days: 6, price: 72400, rating: 4.8, reviews: 156, operator: 'Silk Route Motors', meta: 'Gilgit · Sost · Khunjerab Pass 4,693 m · 6 days', badge: '', sponsored: false, bookingMode: 'instant', cancellationPolicy: 'standard' },
  { id: 'deosai', title: 'Deosai Plains camping — 3 days', img: tourDeosai, alt: 'Open high plateau under cloud', region: 'Gilgit-Baltistan', days: 3, price: 38900, rating: 4.5, reviews: 74, operator: 'Baltistan Trails', meta: 'Sheosar Lake · Bara Pani · 3 days', badge: '', sponsored: false, bookingMode: 'instant', cancellationPolicy: 'standard' },
  { id: 'gwadar', title: 'Gwadar & the Makran coast — 4 days', img: tourGwadar, alt: 'Cliffs above a turquoise coastline', region: 'Balochistan', days: 4, price: 44600, rating: 4.4, reviews: 38, operator: 'Makran Coastal Tours', meta: 'Hingol · Kund Malir · Princess of Hope · 4 days', badge: 'New', sponsored: true, bookingMode: 'instant', cancellationPolicy: 'flexible' },
  { id: 'kalash', title: 'Kalash valleys, Chitral — 5 days', img: tourKalash, alt: 'Terraced valley village in autumn', region: 'Khyber Pakhtunkhwa', days: 5, price: 59800, rating: 4.7, reviews: 89, operator: 'Chitral Heritage Travel', meta: 'Bumburet · Rumbur · Birir · 5 days', badge: '', sponsored: false, bookingMode: 'instant', cancellationPolicy: 'standard' },
  { id: 'passu', title: 'Passu Cones & Borith Lake — 2 days', img: tourPassu, alt: 'Jagged rock spires above a glacier', region: 'Gilgit-Baltistan', days: 2, price: 23400, rating: 4.6, reviews: 143, operator: 'Gojal Adventure Co.', meta: 'Hussaini bridge · Borith · Passu glacier · 2 days', badge: '', sponsored: false, bookingMode: 'instant', cancellationPolicy: 'standard' },
  { id: 'lake', title: 'Naltar valley & coloured lakes — 3 days', img: tourLake, alt: 'Still alpine lake ringed by conifers', region: 'Gilgit-Baltistan', days: 3, price: 34500, rating: 4.5, reviews: 66, operator: 'Gojal Adventure Co.', meta: 'Naltar Bala · blue lake · Pakora · 3 days', badge: '', sponsored: false, bookingMode: 'instant', cancellationPolicy: 'standard' },
];

// Refund fraction by policy tier and days-until-departure (§3, §6 tour/cancel).
// An `operator` cancellation reason always forces 100% regardless of tier —
// enforced by the caller (BookingContext.cancelBooking), not here.
export const CANCELLATION_TIERS = {
  flexible: [{ hours: 24, pct: 100 }],
  standard: [{ hours: 24 * 7, pct: 100 }, { hours: 48, pct: 50 }],
  strict: [{ hours: 24 * 14, pct: 50 }],
};

export function refundPct(policy, hoursUntilDeparture) {
  const tiers = CANCELLATION_TIERS[policy] || CANCELLATION_TIERS.standard;
  const hit = tiers.find((t) => hoursUntilDeparture >= t.hours);
  return hit ? hit.pct : 0;
}

// Day-by-day content per tour, keyed by id — kept separate from the TOURS
// rows so search/home cards (which only need the summary fields) stay light.
export const TOUR_DETAILS = {
  hunza: {
    blurb: 'Five days along the upper Hunza valley. You sleep in Karimabad under Rakaposhi, cross the Hussaini suspension bridge on foot, and drive out to the Passu glacier before the light goes. Jeeps, permits, and a Gojali guide who has walked these tracks since he was nine.',
    facts: [{ k: 'Group size', v: '12 maximum' }, { k: 'Difficulty', v: 'Moderate · some walking at 2,800 m' }, { k: 'Starts', v: 'Gilgit airport or Karimabad' }, { k: 'Includes', v: 'Jeeps, permits, breakfasts, guide' }],
    days: [
      { n: 'D1', t: 'Gilgit to Karimabad', b: 'Pick-up, three hours on the KKH, evening at Baltit Fort.' },
      { n: 'D2', t: 'Attabad Lake and Hussaini', b: 'Boat across Attabad, then the suspension bridge on foot.' },
      { n: 'D3', t: 'Passu glacier', b: 'Walk to the glacier snout. Cones visible all day.' },
      { n: 'D4', t: 'Duikar sunrise', b: 'Early climb to Eagle’s Nest, then Altit village and the apricot orchards.' },
      { n: 'D5', t: 'Back to Gilgit', b: 'Return along the KKH with a stop at Rakaposhi view point.' },
    ],
  },
  skardu: {
    blurb: 'Seven days from the Indus valley up onto the Deosai plateau. Shangrila, the Shigar cold desert, and two nights camping beside Sheosar Lake with Baltistan Trails, who run this route every season.',
    facts: [{ k: 'Group size', v: '14 maximum' }, { k: 'Difficulty', v: 'Easy · mostly jeep and short walks' }, { k: 'Starts', v: 'Skardu airport' }, { k: 'Includes', v: 'Jeeps, camping, all meals, guide' }],
    days: [
      { n: 'D1', t: 'Gilgit to Skardu', b: 'Drive along the Indus, evening at the Kachura viewpoint.' },
      { n: 'D2', t: 'Shangrila & Upper Kachura', b: 'Boat on the lower lake, a short walk to the upper one.' },
      { n: 'D3', t: 'Shigar valley', b: 'The fort, the orchards, and the cold desert dunes at sunset.' },
      { n: 'D4', t: 'Into Deosai', b: 'Jeep track up onto the plateau, camp near Sheosar Lake.' },
      { n: 'D5', t: 'Deosai plains', b: 'A full day on the plateau — brown bears at a distance if you are lucky.' },
      { n: 'D6', t: 'Bara Pani to Skardu', b: 'Descend back into the valley, free afternoon in the bazaar.' },
      { n: 'D7', t: 'Skardu to Gilgit', b: 'Return drive along the Indus and Karakoram highways.' },
    ],
  },
  fairy: {
    blurb: 'Four days to Fairy Meadows and the Nanga Parbat base camp. A jeep to Tato, then on foot through pine forest with Raikot Guides, who hold the local permits for this trailhead.',
    facts: [{ k: 'Group size', v: '10 maximum' }, { k: 'Difficulty', v: 'Hard · trekking at up to 3,300 m' }, { k: 'Starts', v: 'Raikot Bridge, KKH' }, { k: 'Includes', v: 'Jeep, guide, hut stay, meals' }],
    days: [
      { n: 'D1', t: 'Raikot Bridge to Tato', b: 'Jeep up the switchback track from the KKH.' },
      { n: 'D2', t: 'Tato to Fairy Meadows', b: 'A two-hour walk through pine forest to the meadow.' },
      { n: 'D3', t: 'Base camp day hike', b: 'Walk to the Nanga Parbat base camp and back, glacier views all day.' },
      { n: 'D4', t: 'Descend to Raikot', b: 'Retrace the trail and jeep track back to the highway.' },
    ],
  },
  kumrat: {
    blurb: 'Three days in Kumrat, a pine-forest valley the KKH crowds have not found yet. A river camp, a jeep and short trek up to Jahaz Banda, and the waterfall on the way out — run by Dir Valley Tours.',
    facts: [{ k: 'Group size', v: '16 maximum' }, { k: 'Difficulty', v: 'Easy · short walks only' }, { k: 'Starts', v: 'Thal, Upper Dir' }, { k: 'Includes', v: 'Jeep, camping, meals, guide' }],
    days: [
      { n: 'D1', t: 'Thal to Kumrat', b: 'Drive up the valley, afternoon at the river.' },
      { n: 'D2', t: 'Jahaz Banda', b: 'Jeep and a short trek to the high meadow, camp overnight.' },
      { n: 'D3', t: 'Kumrat to Thal', b: 'Morning at the waterfall, then drive back down.' },
    ],
  },
  kkh: {
    blurb: 'Six days up the Karakoram Highway to Khunjerab Pass — the highest paved border crossing anywhere — with Silk Route Motors, who service the route’s jeeps themselves.',
    facts: [{ k: 'Group size', v: '12 maximum' }, { k: 'Difficulty', v: 'Easy · road trip, altitude at the pass' }, { k: 'Starts', v: 'Gilgit airport' }, { k: 'Includes', v: 'Vehicle, permits, breakfasts, driver-guide' }],
    days: [
      { n: 'D1', t: 'Gilgit to Hunza', b: 'Short drive, afternoon in Karimabad.' },
      { n: 'D2', t: 'Hunza to Sost', b: 'Along the KKH past Passu, overnight near the border town.' },
      { n: 'D3', t: 'Khunjerab Pass', b: 'Drive to 4,693 m, the highest paved border crossing in the world.' },
      { n: 'D4', t: 'Sost to Passu', b: 'Cones and Borith Lake on the way back down.' },
      { n: 'D5', t: 'Passu to Hunza', b: 'Free day, with an optional Baltit Fort visit.' },
      { n: 'D6', t: 'Hunza to Gilgit', b: 'Return drive, trip ends at Gilgit airport.' },
    ],
  },
  deosai: {
    blurb: 'Three nights camping on the Deosai plains, one of the highest plateaus in the world, with Baltistan Trails. Built around a full day at Sheosar Lake with room for the weather to move the schedule.',
    facts: [{ k: 'Group size', v: '14 maximum' }, { k: 'Difficulty', v: 'Easy · jeep-based camping' }, { k: 'Starts', v: 'Skardu' }, { k: 'Includes', v: 'Jeep, camping, all meals, guide' }],
    days: [
      { n: 'D1', t: 'Skardu to Deosai', b: 'Jeep onto the plateau, camp near Bara Pani.' },
      { n: 'D2', t: 'Sheosar Lake', b: 'A full day at the lake, wildlife watching at dusk.' },
      { n: 'D3', t: 'Deosai to Skardu', b: 'Descend and the trip ends in Skardu.' },
    ],
  },
  gwadar: {
    blurb: 'Four days down the Makran coastal highway to Gwadar, with Makran Coastal Tours. Hingol’s rock formations, the beach at Kund Malir, and a boat out to the Gwadar headland.',
    facts: [{ k: 'Group size', v: '18 maximum' }, { k: 'Difficulty', v: 'Easy · coastal road trip' }, { k: 'Starts', v: 'Karachi' }, { k: 'Includes', v: 'Vehicle, hotel nights, breakfasts, guide' }],
    days: [
      { n: 'D1', t: 'Karachi to Hingol', b: 'Coastal highway drive, afternoon at the Princess of Hope rock formation.' },
      { n: 'D2', t: 'Kund Malir', b: 'Morning on the beach, then drive on to Gwadar.' },
      { n: 'D3', t: 'Gwadar port and coast', b: 'Boat out to the harbour, sunset at the Gwadar headland.' },
      { n: 'D4', t: 'Gwadar to Karachi', b: 'Return drive along the Makran coastal highway.' },
    ],
  },
  kalash: {
    blurb: 'Five days through the three Kalash valleys — Bumburet, Rumbur and Birir — with Chitral Heritage Travel, who work directly with families in each valley.',
    facts: [{ k: 'Group size', v: '10 maximum' }, { k: 'Difficulty', v: 'Easy · valley walks' }, { k: 'Starts', v: 'Chitral' }, { k: 'Includes', v: 'Jeep, homestay nights, meals, guide' }],
    days: [
      { n: 'D1', t: 'Chitral to Bumburet', b: 'Drive into the valley, evening with a local family.' },
      { n: 'D2', t: 'Bumburet villages', b: 'Walk between settlements, visit the museum.' },
      { n: 'D3', t: 'Rumbur valley', b: 'Cross to the neighbouring valley for the day.' },
      { n: 'D4', t: 'Birir valley', b: 'The quietest of the three — orchards and old wooden houses.' },
      { n: 'D5', t: 'Back to Chitral', b: 'Return drive, trip ends at Chitral.' },
    ],
  },
  passu: {
    blurb: 'A short, sharp two days at Passu — the suspension bridge at Hussaini, a night by Borith Lake, and a morning walk to the glacier snout, with Gojal Adventure Co.',
    facts: [{ k: 'Group size', v: '12 maximum' }, { k: 'Difficulty', v: 'Moderate · one bridge crossing, short walks' }, { k: 'Starts', v: 'Hussaini, KKH' }, { k: 'Includes', v: 'Guide, one night stay, meals' }],
    days: [
      { n: 'D1', t: 'Hussaini to Borith', b: 'Cross the suspension bridge, camp at Borith Lake.' },
      { n: 'D2', t: 'Passu glacier', b: 'Morning walk to the glacier snout, return to the KKH.' },
    ],
  },
  lake: {
    blurb: 'Three days in the Naltar valley, run by Gojal Adventure Co. — a jeep track up to the coloured lakes and, snow permitting, the ski-lift viewpoint above them.',
    facts: [{ k: 'Group size', v: '12 maximum' }, { k: 'Difficulty', v: 'Easy · short walks' }, { k: 'Starts', v: 'Gilgit' }, { k: 'Includes', v: 'Jeep, guide, meals' }],
    days: [
      { n: 'D1', t: 'Gilgit to Naltar', b: 'Jeep track up into the valley.' },
      { n: 'D2', t: 'Naltar lakes', b: 'Walk between the coloured lakes, ski-lift viewpoint if open.' },
      { n: 'D3', t: 'Naltar to Gilgit', b: 'Return drive, trip ends at Gilgit.' },
    ],
  },
};

// Seed for the mutable, canonical availability BookingContext owns (§3: "the
// server is the truth" — availability is never static client state once a
// booking can actually deduct it). This object itself is only the starting
// point read once at app boot; every screen that shows or changes seat counts
// reads BookingContext's live copy via useBooking(), not this export or
// seatsFor() below, which exist only as the seed / a pre-booking fallback.
export const AVAILABILITY = {
  hunza: 7, skardu: 12, fairy: 3, kumrat: 12, kkh: 9,
  deosai: 5, gwadar: 12, kalash: 8, passu: 2, lake: 11,
};

export function seatsFor(id) {
  return AVAILABILITY[id] ?? 12;
}

// Seat-pill thresholds from the design spec: sold out / low / plenty.
// Returns a semantic tone for <StatusPill>, not a baked class string — the
// data layer names the state, the UI layer decides how it looks.
export function seatPill(n) {
  if (n <= 0) return { label: 'Sold out', tone: 'neutral' };
  if (n <= 3) return { label: `${n} seat${n === 1 ? '' : 's'} left`, tone: 'danger' };
  return { label: `${n} seats`, tone: 'success' };
}
