import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/app/useApp';
import { useBooking } from '../../context/booking/useBooking';
import { TOURS, TOUR_DETAILS, seatPill } from '../../data/traveler/tours';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';
import Stepper from '../../components/ui/Stepper';
import TextField from '../../components/ui/TextField';
import { CNIC_ERROR, isValidCnic } from '../../utils/validators';
import tourPassu from '../../assets/traveler/tour-passu.jpg';
import tourCamp from '../../assets/traveler/tour-camp.jpg';

const CANCEL_COPY = {
  flexible: 'Free until 24 hours before departure. Nothing after that.',
  standard: 'Free until 7 days before departure. 50% back until 48 hours before. Nothing after that.',
  strict: '50% back until 14 days before departure. Nothing after that — permits and jeeps are booked well ahead.',
};

export default function TourDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formatMoney } = useApp();
  const { avail, startLock, createRequest } = useBooking();
  const tour = TOURS.find((t) => t.id === id) || TOURS[0];
  const details = TOUR_DETAILS[tour.id];

  const seatsLeft = avail[tour.id] ?? 0;
  // `daysFromNow` is the source of truth for the real departureAt timestamp
  // used by cancellation refund math (computed in onBook, an event handler —
  // never here in render, where reading "now" isn't safe). The `date` label
  // is separate display flavor text and doesn't need to stay calendar-accurate
  // as real time passes, unlike a refund calculation would.
  const departures = [
    { date: '14 Aug 2026', daysFromNow: 14, note: 'Independence week · guide Wajid', seats: seatsLeft },
    { date: '28 Aug 2026', daysFromNow: 28, note: 'Cooler mornings, apricot harvest', seats: 9 },
    { date: '11 Sep 2026', daysFromNow: 45, note: 'Last departure before the pass closes', seats: 0 },
  ];

  const [departure, setDeparture] = useState(0);
  const [guests, setGuests] = useState(2);
  const [requestGuests, setRequestGuests] = useState([{ name: '', cnic: '' }, { name: '', cnic: '' }]);
  const [requestTouched, setRequestTouched] = useState({});

  const chosen = departures[departure];
  const guestCapped = guests >= Math.max(1, chosen.seats);
  const subtotal = tour.price * guests;
  const fee = Math.round(subtotal * 0.04);
  const total = subtotal + fee;
  const soldOut = chosen.seats <= 0;

  const pickDeparture = (i) => {
    if (departures[i].seats <= 0) return;
    setDeparture(i);
    setGuests((g) => Math.min(g, departures[i].seats));
  };

  const setGuestCount = (n) => {
    setGuests(n);
    setRequestGuests((rows) => Array.from({ length: n }, (_, i) => rows[i] || { name: '', cnic: '' }));
  };

  const updateRequestGuest = (i, field, value) => {
    setRequestGuests((rows) => rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  };

  const requestGuestsValid = requestGuests.every((g) => g.name.trim() && isValidCnic(g.cnic));

  const onBook = () => {
    if (tour.bookingMode === 'request') {
      if (!requestGuestsValid) return;
      createRequest({ tourId: tour.id, title: tour.title, price: tour.price, seats: guests, guests: requestGuests });
      navigate('/booking/awaiting-accept');
    } else {
      startLock({
        tourId: tour.id, title: tour.title, price: tour.price, seats: guests,
        departureDays: chosen.daysFromNow,
        cancellationPolicy: tour.cancellationPolicy,
      });
      navigate('/booking/checkout');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid h-[300px] gap-2 overflow-hidden rounded-2xl sm:h-[420px] sm:grid-cols-2 lg:h-[480px]">
        <img
          src={tour.img}
          alt={tour.alt}
          className="col-span-2 h-full w-full object-cover sm:col-span-1"
          style={{ filter: 'saturate(.9) contrast(1.07) hue-rotate(-8deg)' }}
        />
        <div className="grid h-full grid-rows-2 gap-2">
          <img src={tourPassu} alt="Passu Cones from the Karakoram Highway" className="h-full w-full object-cover" style={{ filter: 'saturate(.9) contrast(1.07) hue-rotate(-8deg)' }} />
          <img src={tourCamp} alt="Camp pitched on a high meadow" className="h-full w-full object-cover" style={{ filter: 'saturate(.9) contrast(1.07) hue-rotate(-8deg)' }} />
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-balance font-display text-2xl font-semibold leading-tight tracking-tight sm:text-[34px]">
              {tour.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2.5 text-[13px] text-fg-muted">
              <span className="font-mono font-semibold text-fg">★ {tour.rating.toFixed(1)}</span>
              <span>{tour.reviews} reviews</span>
              <span aria-hidden="true">·</span>
              <span>{tour.meta}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md border border-success bg-success-soft px-2 py-1 text-xs font-semibold text-success-text">
                ✓ Verified operator
              </span>
              <Link to={`/social/profile/${tour.operator.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`} className="text-[13px] font-semibold no-underline">{tour.operator}</Link>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-surface p-4">
            <strong className="text-sm">What you’ll do</strong>
            <p className="text-balance text-sm leading-relaxed text-fg-muted">{details.blurb}</p>
            <div className="grid grid-cols-2 gap-2.5 border-t border-border pt-3 sm:grid-cols-4">
              {details.facts.map((f) => (
                <div key={f.k} className="flex flex-col gap-0.5">
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-fg-subtle">{f.k}</span>
                  <span className="text-[13.5px] font-semibold">{f.v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-surface p-4">
            <strong className="text-sm">Day by day</strong>
            {details.days.map((d) => (
              <div key={d.n} className="flex gap-3 border-b border-border pb-2.5 last:border-0 last:pb-0">
                <span className="h-fit flex-none rounded-md border border-primary-line bg-primary-soft px-1.5 py-1 font-mono text-[11px] font-bold text-primary-soft-text">
                  {d.n}
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm font-bold">{d.t}</span>
                  <span className="text-[12.5px] leading-relaxed text-fg-muted">{d.b}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3.5 lg:sticky lg:top-24">
          <div className="flex flex-col gap-3.5 rounded-2xl border border-border-strong bg-surface p-4 shadow-sh2">
            <div className="flex items-baseline justify-between gap-2 border-b-4 border-accent pb-2">
              <span className="font-mono text-xl font-semibold sm:text-2xl">{formatMoney(tour.price)}</span>
              <span className="text-[12.5px] text-fg-muted">per person</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[12.5px] font-bold">Choose a departure</span>
              {departures.map((d, i) => {
                const full = d.seats <= 0;
                const active = departure === i;
                const pill = seatPill(d.seats);
                return (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => pickDeparture(i)}
                    disabled={full}
                    aria-pressed={active}
                    className={`flex min-h-[56px] items-center justify-between gap-2.5 rounded-lg border px-3 py-2 text-start ${
                      full ? 'cursor-not-allowed bg-sunken opacity-60' : active ? 'cursor-pointer border-2 border-primary bg-primary-soft' : 'cursor-pointer border-border-strong bg-surface'
                    }`}
                  >
                    <span className="flex flex-col gap-0.5">
                      <span className="text-[13.5px] font-bold">{d.date}</span>
                      <span className="text-[11.5px] text-fg-muted">{d.note}</span>
                    </span>
                    <StatusPill tone={pill.tone} className="flex-none">{pill.label}</StatusPill>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[12.5px] font-bold">Travellers</span>
              <Stepper value={guests} onChange={setGuestCount} min={1} max={chosen.seats || 1} srLabel="traveller" />
              {guestCapped && (
                <span className="text-xs leading-relaxed text-danger-text">Only {chosen.seats} seats left on this departure.</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5 border-t border-border pt-2.5 text-[13px]">
              <div className="flex justify-between gap-2.5 text-fg-muted">
                <span>{formatMoney(tour.price)} × {guests}</span>
                <span className="font-mono">{formatMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between gap-2.5 text-fg-muted">
                <span>Service fee</span>
                <span className="font-mono">{formatMoney(fee)}</span>
              </div>
              <div className="mt-0.5 flex justify-between gap-2.5 border-t-4 border-accent pt-2 text-[15px] font-bold">
                <span>Total</span>
                <span className="font-mono">{formatMoney(total)}</span>
              </div>
            </div>

            {tour.bookingMode === 'request' && !soldOut && (
              <div className="flex flex-col gap-2 border-t border-border pt-2.5">
                <span className="text-[12.5px] font-bold">Traveller details</span>
                {requestGuests.map((g, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2">
                    <TextField
                      aria-label={`Traveller ${i + 1} name`}
                      placeholder={`Traveller ${i + 1} name`}
                      value={g.name}
                      onChange={(e) => updateRequestGuest(i, 'name', e.target.value)}
                    />
                    <TextField
                      aria-label={`Traveller ${i + 1} CNIC`}
                      dir="ltr"
                      placeholder="00000-0000000-0"
                      value={g.cnic}
                      onChange={(e) => updateRequestGuest(i, 'cnic', e.target.value)}
                      onBlur={() => setRequestTouched((t) => ({ ...t, [i]: true }))}
                      error={requestTouched[i] && !isValidCnic(g.cnic) ? CNIC_ERROR : null}
                    />
                  </div>
                ))}
              </div>
            )}

            <Button onClick={onBook} disabled={soldOut || (tour.bookingMode === 'request' && !requestGuestsValid)} size="lg" fullWidth>
              {soldOut
                ? 'Sold out on this date'
                : tour.bookingMode === 'request'
                  ? `Request ${guests} ${guests === 1 ? 'seat' : 'seats'} — operator has 24h`
                  : `Hold ${guests} ${guests === 1 ? 'seat' : 'seats'} for 10 minutes`}
            </Button>
            <p className="text-xs leading-relaxed text-fg-muted">
              {tour.bookingMode === 'request'
                ? 'No seats are deducted and you are not charged until the operator accepts.'
                : 'Your seats are held for ten minutes while you pay. You are not charged until the operator confirms.'}
            </p>
            {tour.bookingMode !== 'request' && guests >= 2 && !soldOut && (
              <Link
                to="/booking/group-split"
                state={{ tourId: tour.id, title: tour.title, price: tour.price }}
                className="text-center text-xs font-semibold text-primary-soft-text no-underline"
              >
                Split the cost with the group instead
              </Link>
            )}
          </div>

          <div className="flex flex-col gap-1.5 rounded-2xl border border-border bg-surface p-4">
            <strong className="text-[13.5px]">Cancellation</strong>
            <div className="text-[12.5px] leading-relaxed text-fg-muted">
              {CANCEL_COPY[tour.cancellationPolicy] || CANCEL_COPY.standard}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
