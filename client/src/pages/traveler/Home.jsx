import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/useApp';
import { useBooking } from '../../context/useBooking';
import { useTransport } from '../../context/useTransport';
import { TOURS } from '../../data/traveler/tours';
import TourCard from '../../components/traveler/TourCard';
import Button from '../../components/ui/Button';
import Stepper from '../../components/ui/Stepper';
import heroHome from '../../assets/traveler/hero-home.jpg';
import tourHunza from '../../assets/traveler/tour-hunza.jpg';
import tourCamp from '../../assets/traveler/tour-camp.jpg';
import vehJeep from '../../assets/traveler/veh-jeep.jpg';
import propLodge from '../../assets/traveler/prop-lodge.jpg';
import gearJacket from '../../assets/traveler/gear-jacket.jpg';
import feedSummit from '../../assets/traveler/feed-summit.jpg';
import tourFairy from '../../assets/traveler/tour-fairy.jpg';
import tourKkh from '../../assets/traveler/tour-kkh.jpg';

// Six real doors into the platform. Each routes to role selection with that
// role already chosen — see systemDesign B3 (onboarding) for the receiving screen.
const ACTOR_TILES = [
  { code: 'TRV', title: 'Travellers', meta: 'Book trips and stays', verb: 'Search', role: 'traveller' },
  { code: 'OPR', title: 'Tour Operators', meta: 'Sell your itineraries', verb: 'Apply', role: 'operator' },
  { code: 'TRN', title: 'Transporters', meta: 'Jeeps and coasters', verb: 'Apply', role: 'transport' },
  { code: 'PRP', title: 'Hotels & Restaurants', meta: 'Rooms and tables', verb: 'Apply', role: 'property' },
  { code: 'SLR', title: 'Marketplace Sellers', meta: 'Ship gear anywhere', verb: 'Apply', role: 'seller' },
  { code: 'INF', title: 'Influencers', meta: 'Collaborate and earn', verb: 'Join', role: 'influencer' },
];

// Live numbers the same store the booking, payout and stock screens read.
// `seats`/`quotes`/`rooms` read real context state (§3) — the rest are
// stubbed locally until social/shop are wired.
const STUB = { stock: 6, referral: 5922, commissionPct: 12, referralPct: 4 };

// `hunzaSeats`/`openQuotes`/`roomsLive` are the live figures here (real
// BookingContext/TransportContext state); the rest are stubs until social/
// shop are wired — kept as a builder function, not a module-level constant,
// so the stats update after a real mutation instead of freezing at import.
function buildRoad(hunzaSeats, openQuotes, roomsLive) {
  return [
    {
      name: 'For travellers', km: 'KM 0', img: tourHunza, alt: 'Turquoise Attabad Lake from the Karakoram Highway',
      quote: 'I want to be on a jeep by Friday, not emailing strangers for a week.',
      caps: ['Search without an account', 'Seats held 10 minutes', 'Refunds in rupees'],
      stat: `${hunzaSeats} seats left on Hunza today`, cta: 'See the live search', href: '/discover/search',
    },
    {
      name: 'For tour operators', km: 'KM 148', img: tourCamp, alt: 'Camp pitched below a glacier',
      quote: 'Half my season used to go on WhatsApp screenshots and lost deposits.',
      caps: ['Accept or decline in 24 h', 'Payout after the trip runs', 'Availability deducts on acceptance'],
      stat: `Operators keep ${100 - STUB.commissionPct}% of every booking`, cta: 'Open an operator dashboard', href: '/vendor/dashboard',
    },
    {
      name: 'For transporters', km: 'KM 312', img: vehJeep, alt: 'A jeep on a high mountain track',
      quote: 'The road is my expertise. Quoting it should not be the hard part.',
      caps: ['Quote per seat or per vehicle', 'Permits tracked with expiry', 'Leads, never surprise bookings'],
      stat: `${openQuotes} quote request${openQuotes === 1 ? '' : 's'} open right now`, cta: 'Open the quote inbox', href: '/transport/quotes',
    },
    {
      name: 'For hotels & restaurants', km: 'KM 465', img: propLodge, alt: 'A stone lodge above a valley',
      quote: 'In season I turn people away. Out of season the rooms sit empty.',
      caps: ['Rooms and rate plans', 'Menus with live availability', 'Enquiries or instant booking'],
      stat: `${roomsLive} rooms live tonight`, cta: 'See the room manager', href: '/discover/property',
    },
    {
      name: 'For marketplace sellers', km: 'KM 588', img: gearJacket, alt: 'A four-season down jacket',
      quote: 'People need the jacket before the trip, not after they have frozen.',
      caps: ['Ship anywhere in Pakistan', 'Stock never oversells', 'Returns reverse the commission'],
      stat: `${STUB.stock} down jackets in stock right now`, cta: 'Watch stock on the shelf', href: '/shop/seller-products',
    },
    {
      name: 'For influencers', km: 'KM 700', img: feedSummit, alt: 'A climber on a summit ridge',
      quote: 'I send people north every week. I have never once been paid for it.',
      caps: ['Referral links that convert', 'Paid collabs, always disclosed', 'Gross and net, never fuzzy'],
      stat: `Rs ${STUB.referral.toLocaleString('en-US')} commission accruing at ${STUB.referralPct}%`,
      cta: 'Trace a referral to its booking', href: '/social/referrals',
    },
  ];
}

const CATEGORIES = [
  { title: 'Treks', meta: '14 routes · Nanga Parbat to K2 base', img: tourFairy, href: '/discover/search' },
  { title: 'Road trips', meta: 'The KKH, Deosai, the Makran coast', img: tourKkh, href: '/discover/search' },
  { title: 'Stays', meta: 'Lodges, guest houses, camps', img: propLodge, href: '/discover/property' },
];

export default function Home() {
  const navigate = useNavigate();
  const { formatMoney } = useApp();
  const { avail } = useBooking();
  const { leads, rooms } = useTransport();
  const [where, setWhere] = useState('');
  const [when, setWhen] = useState('2026-08-14');
  const [guests, setGuests] = useState(2);

  const doSearch = () => navigate('/discover/search', { state: { where } });

  const featured = TOURS.slice(0, 4);
  const trending = TOURS.slice(2, 6);
  const deltas = ['+38%', '+21%', '+17%', '+9%'];
  const openQuotes = leads.filter((l) => l.kind === 'transport' && l.status === 'request').length;
  const roomsLive = rooms.reduce((n, r) => n + (r.total - r.booked), 0);
  const road = buildRoad(avail.hunza ?? 0, openQuotes, roomsLive);

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      {/* Hero: search + six doors */}
      <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
        <div className="flex flex-col justify-center gap-5 py-1">
          <div className="flex flex-col gap-2">
            <h1 className="max-w-[20ch] text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
              Go north before the passes close.
            </h1>
            <p className="max-w-[42ch] text-base leading-relaxed text-fg-muted">
              Verified operators across Gilgit-Baltistan, Chitral and the Makran coast. Pay in rupees, hold your seat
              for ten minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 items-end gap-2.5 rounded-2xl border border-border bg-surface p-3 shadow-sh2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="q-where" className="text-[11.5px] font-bold text-fg-muted">WHERE</label>
              <input
                id="q-where"
                type="text"
                value={where}
                onChange={(e) => setWhere(e.target.value)}
                placeholder="Hunza, Skardu, Kumrat…"
                className="min-h-[46px] w-full rounded-lg border border-border-strong bg-raised px-3 text-[15px] text-fg"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="q-when" className="text-[11.5px] font-bold text-fg-muted">WHEN</label>
              <input
                id="q-when"
                type="date"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                className="min-h-[46px] w-full rounded-lg border border-border-strong bg-raised px-3 font-mono text-sm text-fg"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11.5px] font-bold text-fg-muted">TRAVELLERS</span>
              <Stepper value={guests} onChange={setGuests} min={1} max={12} srLabel="traveller" />
            </div>
            <Button onClick={doSearch}>Search {TOURS.length} trips</Button>
          </div>
          <p className="max-w-[40ch] text-xs leading-relaxed text-fg-subtle">
            Searching needs no account. The tiles beside this are for the people who make the trips happen.
          </p>
        </div>

        <div className="relative flex min-h-[280px] flex-col justify-end gap-3 overflow-hidden rounded-2xl bg-ink-900 p-3 shadow-sh2 sm:min-h-[400px] sm:p-4">
          <img
            src={heroHome}
            alt="Karakoram peaks above a glacial valley"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ filter: 'saturate(.9) contrast(1.07) hue-rotate(-8deg)' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(120% 90% at 78% 8%, rgba(4,26,32,.10) 0%, rgba(4,20,26,.52) 46%, rgba(4,20,26,.88) 100%)',
            }}
          />
          <div className="relative flex items-end gap-2.5">
            <div className="min-w-0 flex-1">
              <span className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-wider text-[#C9D3D6]">
                Six ways in <span className="h-px flex-1 bg-gradient-to-r from-white/35 to-transparent" />
              </span>
              <p className="max-w-[28ch] text-sm font-semibold leading-snug text-white">
                Pick your pass. Whichever side of the trip you are on, it starts here.
              </p>
            </div>
            <span
              aria-hidden="true"
              dir="ltr"
              className="flex-none font-mono text-3xl font-bold leading-none text-transparent sm:text-4xl"
              style={{ WebkitTextStroke: '1.2px rgba(255,255,255,.42)' }}
            >
              06
            </span>
          </div>

          <div className="relative grid grid-cols-2 gap-2">
            {ACTOR_TILES.map((tile, i) => (
              <Link
                key={tile.code}
                to="/identity/role"
                state={{ role: tile.role }}
                className={`relative flex min-h-[64px] flex-col gap-1 overflow-hidden rounded-r-[11px] rounded-l-[4px] border border-white/25 px-2.5 pb-2 pt-2 text-white no-underline backdrop-blur-sm ${
                  i % 2 === 1 ? 'mt-3 sm:mt-5' : ''
                }`}
                style={{
                  background: 'linear-gradient(180deg, rgba(12,17,19,.80), rgba(6,10,12,.84))',
                  borderInlineStart: `4px solid ${i === 0 ? 'var(--accent)' : 'var(--primary)'}`,
                }}
              >
                <span dir="ltr" className="font-mono text-[10px] tracking-wider text-[#BAC7CB]">
                  {tile.code}·0{i + 1}
                </span>
                <span className="text-[13px] font-bold leading-tight sm:text-sm">{tile.title}</span>
                <span className="text-[11.5px] leading-tight text-[#D6DBDD]">{tile.meta}</span>
                <span className="mt-auto flex items-center gap-1.5 border-t border-dashed border-white/25 pt-1.5 font-mono text-[9.5px] uppercase tracking-wider text-[#B9C6C9]">
                  {tile.verb}
                  <span aria-hidden="true" className="ml-auto text-white">→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Today on the road */}
      <div className="flex flex-col gap-5">
        <div className="flex max-w-[52ch] flex-col gap-1.5">
          <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-fg-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> Live from the running platform · today
          </span>
          <h2 className="text-balance font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            Today on the road.
          </h2>
          <p className="text-sm leading-relaxed text-fg-muted sm:text-base">
            You picked a door above. This is what is actually happening behind each one right now — every number
            below is read from the same store the booking, payout and stock screens run on.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {road.map((r, i) => (
            <div key={r.name} className="grid grid-cols-[38px_minmax(0,1fr)] items-stretch gap-2.5 sm:grid-cols-[54px_minmax(0,1fr)] sm:gap-3.5">
              <div className="relative flex flex-col items-center gap-2 py-1.5">
                <span className="h-3 w-3 flex-none rounded-full border-[3px] border-bg bg-primary shadow-[0_0_0_1px_var(--primary)]" />
                <span className="w-0.5 flex-1 rounded-full bg-gradient-to-b from-primary via-border-loud to-transparent" />
                <span
                  dir="ltr"
                  className="hidden font-mono text-[11px] tracking-wider text-fg-muted sm:block"
                  style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                >
                  {r.km}
                </span>
              </div>

              <div className="grid items-center gap-0 overflow-hidden rounded-2xl border border-border bg-surface shadow-sh1 sm:grid-cols-2">
                <div
                  className={`relative aspect-[5/4] min-h-[190px] bg-ink-900 ${i % 2 === 1 ? 'sm:order-2' : 'sm:order-1'}`}
                >
                  <img src={r.img} alt={r.alt} loading="lazy" className="h-full w-full object-cover" style={{ filter: 'saturate(.9) contrast(1.07) hue-rotate(-8deg)' }} />
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(135deg, rgba(4,20,26,.42) 0%, rgba(4,20,26,.10) 55%, rgba(4,20,26,.34) 100%)' }}
                  />
                </div>
                <div className={`flex flex-col gap-3 p-4 sm:p-6 ${i % 2 === 1 ? 'sm:order-1' : 'sm:order-2'}`}>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-fg-muted">{r.name}</span>
                  <div className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-success" />
                    <span dir="ltr" className="text-balance font-display text-xl font-bold leading-tight tracking-tight sm:text-[26px]">
                      {r.stat}
                    </span>
                  </div>
                  <p className="text-[15px] leading-relaxed text-fg-muted">“{r.quote}”</p>
                  <div className="flex flex-wrap gap-1.5">
                    {r.caps.map((c) => (
                      <span key={c} className="rounded-md border border-border-loud bg-sunken px-2.5 py-1.5 text-xs font-semibold text-fg-muted">
                        {c}
                      </span>
                    ))}
                  </div>
                  <Link to={r.href} className="flex w-fit items-center gap-2 text-sm font-bold text-primary-soft-text no-underline">
                    {r.cta} <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <h3 className="w-fit border-b-4 border-accent pb-1 font-display text-xl font-semibold tracking-tight sm:text-2xl">
            Featured this week
          </h3>
          <span className="text-xs text-fg-muted">Chosen by our editors — not paid placement.</span>
          <Link to="/discover/search" className="ml-auto text-sm font-semibold no-underline">
            See all {TOURS.length}
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((t) => (
            <TourCard key={t.id} tour={t} layout="vertical" />
          ))}
        </div>
      </div>

      {/* Trending */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">Trending in the last 7 days</h3>
          <span className="text-xs text-fg-muted">Ranked by bookings completed, not by views.</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {trending.map((t, i) => (
            <Link
              key={t.id}
              to={`/discover/tour/${t.id}`}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-2.5 text-fg no-underline"
            >
              <span className="w-6 flex-none text-center font-mono text-lg font-bold text-fg-subtle">{i + 1}</span>
              <img
                src={t.img}
                alt={t.alt}
                loading="lazy"
                className="h-[72px] w-[72px] flex-none rounded-lg object-cover"
                style={{ filter: 'saturate(.9) contrast(1.07) hue-rotate(-8deg)' }}
              />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-sm font-bold leading-snug">{t.title}</span>
                <span className="text-xs text-fg-muted">{t.meta}</span>
                <span className="font-mono text-[13.5px] font-semibold">{formatMoney(t.price)}</span>
              </span>
              <span className="flex-none font-mono text-xs font-bold text-success-text">{deltas[i]}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {CATEGORIES.map((c) => (
          <Link
            key={c.title}
            to={c.href}
            className="relative flex min-h-[132px] items-end overflow-hidden rounded-2xl no-underline"
          >
            <img src={c.img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" style={{ filter: 'saturate(.9) contrast(1.07) hue-rotate(-8deg)' }} />
            <span className="absolute inset-0 bg-gradient-to-t from-black/85 to-black/10" />
            <span className="relative flex flex-col gap-0.5 p-3.5">
              <span className="font-display text-lg font-semibold text-white">{c.title}</span>
              <span className="text-xs text-[#D3D3D8]">{c.meta}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
