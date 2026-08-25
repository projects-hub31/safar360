// Hand-curated landmark collection (CLAUDE.md §3: "Landmarks are a
// hand-curated collection... the assistant/chatbot can reference them but
// never adds to the list; model as its own collection, not user-generated
// content"). Names/regions/elevations are pulled from what's already real in
// `data/traveler/tours.js` (e.g. Khunjerab Pass's "4,693 m" already appears
// in the `kkh` tour's `meta` string) rather than invented fresh — every
// `relatedTourIds` entry is a real id in `TOURS`.
//
// `coords` are `{ x, y }` as 0–100 percentages of a stylized, schematic map
// canvas (Map.jsx) — deliberately NOT real lat/lng. This app has no mapping
// library dependency (CLAUDE.md's tech stack section rules out adding one
// without raising it first), so the map is a lightweight illustrative layout
// of the same regions TOURS already covers, not a literal geographic
// projection.
export const LANDMARKS = [
  {
    id: 'khunjerab-pass',
    name: 'Khunjerab Pass',
    region: 'Gilgit-Baltistan',
    coords: { x: 58, y: 14 },
    elevation: '4,693 m',
    blurb: 'The highest paved international border crossing in the world, at the top of the Karakoram Highway. Marmots, ibex, and a stone marker where the road tips into China.',
    facts: ['Highest paved border crossing anywhere', 'Open seasonally — closed by heavy snow most winters', 'Border formalities on the Pakistani side at Sost, further down the highway'],
    relatedTourIds: ['kkh'],
    accessNotes: 'Reached by jeep or car from Sost, roughly 2 hours. Altitude sickness is a real risk above 4,000 m — the standard tour itinerary treats this as a pass-through, not an overnight stop.',
  },
  {
    id: 'hunza-attabad',
    name: 'Attabad Lake, Hunza',
    region: 'Gilgit-Baltistan',
    coords: { x: 52, y: 16 },
    elevation: '~2,500 m',
    blurb: 'A turquoise lake formed in 2010 when a landslide dammed the Hunza River. Boats cross to the Hussaini suspension bridge; Karimabad and Baltit Fort sit a short drive above.',
    facts: ['Formed by a 2010 landslide, not a natural lake', 'Overlooked by Rakaposhi (7,788 m)', 'Boat crossing is the standard way over — the old road is submerged'],
    relatedTourIds: ['hunza'],
    accessNotes: 'On the Karakoram Highway, a paved drive from Gilgit. Boat crossings run through daylight hours; no fixed schedule off-season.',
  },
  {
    id: 'naltar-valley',
    name: 'Naltar Valley',
    region: 'Gilgit-Baltistan',
    coords: { x: 44, y: 20 },
    elevation: '~3,050 m',
    blurb: 'A side valley off the Hunza road, known for a run of small coloured lakes and, in winter, one of Pakistan\'s few ski lifts.',
    facts: ['Three named lakes, each a different shade of blue-green', 'Ski lift operates December–March, snow permitting', 'Also home to a Pakistan Air Force training base'],
    relatedTourIds: ['lake'],
    accessNotes: 'Jeep track only past the village — a normal car does not make the final stretch. Roughly 2 hours from Gilgit.',
  },
  {
    id: 'fairy-meadows',
    name: 'Fairy Meadows',
    region: 'Gilgit-Baltistan',
    coords: { x: 48, y: 26 },
    elevation: '~3,300 m',
    blurb: 'An alpine meadow facing Nanga Parbat\'s Rupal Face, reached on foot after a jeep track from the Karakoram Highway. No road runs the whole way — that\'s deliberate.',
    facts: ['Faces the 4,600 m Rupal Face of Nanga Parbat (8,126 m)', 'Final approach is on foot only, roughly 2 hours from Tato', 'Named by early expeditions, not a literal translation of a local name'],
    relatedTourIds: ['fairy'],
    accessNotes: 'Jeep to Tato from Raikot Bridge, then walk in. Huts and camping only — no vehicle access to the meadow itself.',
  },
  {
    id: 'deosai-sheosar',
    name: 'Sheosar Lake, Deosai Plains',
    region: 'Gilgit-Baltistan',
    coords: { x: 68, y: 24 },
    elevation: '~4,114 m',
    blurb: 'One of the highest plateaus in the world, a wide alpine steppe between Skardu and Astore. Sheosar Lake sits near its centre; the plains are a protected brown-bear habitat.',
    facts: ['Among the highest plateaus on Earth', 'Protected national park — brown bear habitat', 'Only accessible roughly June–September; snowbound the rest of the year'],
    relatedTourIds: ['skardu', 'deosai'],
    accessNotes: 'Jeep track from Skardu, seasonal only. No fuel or phone signal on the plateau itself — carry what you need.',
  },
  {
    id: 'kalash-valleys',
    name: 'Kalash Valleys (Bumburet, Rumbur, Birir)',
    region: 'Khyber Pakhtunkhwa',
    coords: { x: 22, y: 22 },
    elevation: '~1,981 m',
    blurb: 'Three valleys near Chitral, home to the Kalash people and a distinct culture, language and festival calendar found nowhere else in the country.',
    facts: ['Home to the Kalash, a distinct indigenous community', 'Three valleys, each with its own villages and rhythm', 'Chowmos, the winter festival, draws visitors from outside the valleys too'],
    relatedTourIds: ['kalash'],
    accessNotes: 'Paved road most of the way from Chitral town; the last stretch into Birir is rougher. Respect local photography customs, especially around festivals.',
  },
  {
    id: 'gwadar-coast',
    name: 'Gwadar & the Makran Coast',
    region: 'Balochistan',
    coords: { x: 15, y: 88 },
    elevation: 'Sea level',
    blurb: 'A natural harbour on the Arabian Sea, with the Hingol rock formations and Kund Malir\'s beach on the drive down from Karachi.',
    facts: ['Hingol National Park includes the "Princess of Hope" rock formation', 'Gwadar\'s natural harbour has been used by fishing communities for generations', 'Coastal highway runs the full stretch from Karachi'],
    relatedTourIds: ['gwadar'],
    accessNotes: 'A full day\'s drive from Karachi on the coastal highway. Best outside the summer heat — road stretches have little shade.',
  },
];

export function landmarkById(id) {
  return LANDMARKS.find((l) => l.id === id) || null;
}
