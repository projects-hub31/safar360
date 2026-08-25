import feedSummit from '../../assets/traveler/feed-summit.jpg';

// Shared moderation registry (CLAUDE.md §3 "Moderation contract — batch 07 ↔
// batch 09, one shared registry"). Module 09 (admin) doesn't exist yet, but
// this is written to be the exact same table an admin moderation queue would
// import later — not a social-only copy that would have to be reconciled.
export const REPORT_REASONS = [
  { id: 'spam', label: 'Spam', description: 'Repetitive, irrelevant, or bulk content.' },
  { id: 'harassment', label: 'Harassment', description: 'Targets or abuses a specific person.' },
  { id: 'misinfo', label: 'Dangerous misinformation', description: 'False claims that could put someone at risk.' },
  { id: 'undisclosed', label: 'Undisclosed paid promotion', description: 'Reads as an ad without saying so.' },
  { id: 'stolen', label: 'Stolen content', description: 'Someone else’s photo, video, or writing, posted as their own.' },
  { id: 'other', label: 'Other', description: 'Doesn’t fit the reasons above.' },
];

// Exact legal transition table (§3) — nothing else is a legal move. Decision
// buttons anywhere in the app should be generated from this, never hardcoded.
export const CONTENT_STATES = {
  live: ['reported'],
  reported: ['under_review', 'live'],
  under_review: ['removed', 'restored'],
  removed: ['restored'],
  restored: ['reported'],
};

export const AUTO_REVIEW_AT = 3; // §3: 3 independent reports auto-hides content pending human review
export const POST_MAX_CHARS = 2200;
export const HASHTAG_RE = /#[\w؀-ۿ]+/gu; // supports Urdu-script tags, §6 composer

export const POST_TYPES = [
  { id: 'trip-report', label: 'Trip report' },
  { id: 'photo', label: 'Photo' },
  { id: 'announce-departure', label: 'Announce a departure' },
];

export const AUTHORS = {
  'karakoram-expeditions': { id: 'karakoram-expeditions', name: 'Karakoram Expeditions', kind: 'operator', tier: null, verified: true },
  'baltistan-trails': { id: 'baltistan-trails', name: 'Baltistan Trails', kind: 'operator', tier: null, verified: true },
  'amna-sheikh': { id: 'amna-sheikh', name: 'Amna Sheikh', kind: 'influencer', tier: 'Platinum', verified: true },
  'bilal-yousaf': { id: 'bilal-yousaf', name: 'Bilal Yousaf', kind: 'traveller', tier: null, verified: false },
};

// A comment/post's own `state` follows the same live/under_review vocabulary
// as CONTENT_STATES; comments only ever reach `under_review`, never the
// later moderation states, since removing a single comment is out of scope
// for this traveller-facing pass (§6 post: "a comment under_review renders
// italic+muted... never hard deleted mid-review").
export const SEED_POSTS = [
  {
    id: 'p1', authorId: 'karakoram-expeditions', type: 'announce-departure', tourId: 'hunza',
    text: 'Our next Hunza & Attabad Lake departure just opened — five days, a small group, and guide Wajid who has walked these tracks since he was nine.',
    img: feedSummit, alt: 'Trekkers on a ridge above cloud',
    tags: ['#Hunza', '#Karakoram'], sponsored: false, disclosed: false,
    moderation: 'live', reportCount: 0, likedByMe: false, savedByMe: false, likes: 41, saves: 12,
    comments: [
      { id: 'c1', authorId: 'bilal-yousaf', text: 'Is this the one with the Hussaini bridge crossing?', state: 'live', createdAt: Date.now() - 2.5 * 3600000 },
    ],
    createdAt: Date.now() - 3 * 3600000,
  },
  {
    id: 'p2', authorId: 'amna-sheikh', type: 'trip-report', tourId: 'skardu',
    text: 'Seven days across Skardu and the Deosai plains with Baltistan Trails — paid partnership, full day-by-day breakdown below.',
    img: null, alt: '',
    tags: ['#Skardu', '#Deosai'], sponsored: true, disclosed: true,
    moderation: 'live', reportCount: 0, likedByMe: false, savedByMe: false, likes: 212, saves: 58,
    comments: [
      { id: 'c1', authorId: 'karakoram-expeditions', text: 'Beautiful write-up, Amna!', state: 'live', createdAt: Date.now() - 20 * 3600000 },
    ],
    createdAt: Date.now() - 26 * 3600000,
  },
  {
    id: 'p3', authorId: 'bilal-yousaf', type: 'photo', tourId: null,
    text: 'Sunrise from Duikar. Worth the 5am alarm.',
    img: null, alt: '',
    tags: ['#Hunza', '#Duikar'], sponsored: false, disclosed: false,
    moderation: 'live', reportCount: 2, likedByMe: false, savedByMe: false, likes: 89, saves: 15,
    comments: [],
    createdAt: Date.now() - 50 * 3600000,
  },
  {
    id: 'p4', authorId: 'baltistan-trails', type: 'announce-departure', tourId: 'deosai',
    text: 'Deosai Plains camping — one more departure before the pass closes for winter.',
    img: null, alt: '',
    tags: ['#Deosai'], sponsored: false, disclosed: false,
    moderation: 'under_review', reportCount: 3, likedByMe: false, savedByMe: false, likes: 6, saves: 1,
    comments: [],
    createdAt: Date.now() - 4 * 3600000,
  },
];

// Message states exactly: Sending → Sent → Delivered → Failed (§6 thread).
// A body containing FAILTEST is a deterministic magic trigger, same spirit as
// the auth module's magic OTP — lets the Failed+retry branch be reached from
// the UI without waiting on a real flaky network.
export const FAIL_MESSAGE_TRIGGER = 'FAILTEST';

export const SEED_THREADS = [
  {
    id: 't1', withId: 'karakoram-expeditions', blocked: false,
    messages: [
      { id: 'm1', from: 'them', text: 'Your Hunza departure is confirmed for the 14th — see you at Gilgit airport.', state: 'delivered', at: Date.now() - 2 * 3600000 },
      { id: 'm2', from: 'me', text: 'Perfect, thank you!', state: 'delivered', at: Date.now() - 1.8 * 3600000 },
      { id: 'm3', from: 'them', text: 'One more thing — bring a warm layer, evenings in Karimabad are cold this week.', state: 'delivered', at: Date.now() - 3600000 },
    ],
  },
  {
    id: 't2', withId: 'baltistan-trails', blocked: false,
    messages: [
      { id: 'm1', from: 'me', text: 'Is the Skardu trip still running in October?', state: 'delivered', at: Date.now() - 20 * 3600000 },
      { id: 'm2', from: 'them', text: 'Yes — one departure left, the 12th.', state: 'delivered', at: Date.now() - 19 * 3600000 },
    ],
  },
  {
    id: 't3', withId: 'bilal-yousaf', blocked: true,
    messages: [
      { id: 'm1', from: 'them', text: 'Hey, saw your comment on my post.', state: 'delivered', at: Date.now() - 72 * 3600000 },
    ],
  },
];
