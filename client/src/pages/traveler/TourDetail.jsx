import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../../context/useApp';
import { TOURS, TOUR_DETAILS, seatPill, seatsFor } from '../../data/traveler/tours';
import tourPassu from '../../assets/traveler/tour-passu.jpg';
import tourCamp from '../../assets/traveler/tour-camp.jpg';

export default function TourDetail() {
  const { id } = useParams();
  const { formatMoney } = useApp();
  const tour = TOURS.find((t) => t.id === id) || TOURS[0];
  const details = TOUR_DETAILS[tour.id];

  const seatsLeft = seatsFor(tour.id);
  const departures = [
    { date: '14 Aug 2026', note: 'Independence week · guide Wajid', seats: seatsLeft },
    { date: '28 Aug 2026', note: 'Cooler mornings, apricot harvest', seats: 9 },
    { date: '11 Sep 2026', note: 'Last departure before the pass closes', seats: 0 },
  ];

  const [departure, setDeparture] = useState(0);
  const [guests, setGuests] = useState(2);

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
              <Link to="/social/profile" className="text-[13px] font-semibold no-underline">{tour.operator}</Link>
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
                    <span className={`${pill.className} flex-none`}>{pill.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[12.5px] font-bold">Travellers</span>
              <div className="flex min-h-[48px] items-center gap-1.5 rounded-lg border border-border-strong bg-raised px-1.5">
                <button
                  type="button" onClick={() => setGuests((g) => Math.max(1, g - 1))} aria-label="One fewer traveller"
                  className="h-[38px] w-[38px] flex-none rounded-lg border border-border bg-surface text-lg text-fg"
                >
                  −
                </button>
                <span aria-live="polite" className="flex-1 text-center font-mono text-base font-semibold tabular-nums">{guests}</span>
                <button
                  type="button"
                  onClick={() => setGuests((g) => Math.min(chosen.seats || 1, g + 1))}
                  disabled={guestCapped}
                  aria-label="One more traveller"
                  className={`h-[38px] w-[38px] flex-none rounded-lg border text-lg ${guestCapped ? 'cursor-not-allowed border-border bg-sunken text-fg-subtle' : 'cursor-pointer border-border bg-surface text-fg'}`}
                >
                  +
                </button>
              </div>
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

            <Link
              to="/booking/checkout"
              aria-disabled={soldOut}
              onClick={(e) => soldOut && e.preventDefault()}
              className={`min-h-[54px] rounded-lg text-center text-[15.5px] font-bold leading-[54px] no-underline ${
                soldOut ? 'pointer-events-none bg-border text-fg-subtle' : 'bg-primary text-primary-on'
              }`}
            >
              {soldOut ? 'Sold out on this date' : `Hold ${guests} ${guests === 1 ? 'seat' : 'seats'} for 10 minutes`}
            </Link>
            <p className="text-xs leading-relaxed text-fg-muted">
              Your seats are held for ten minutes while you pay. You are not charged until the operator confirms.
            </p>
          </div>

          <div className="flex flex-col gap-1.5 rounded-2xl border border-border bg-surface p-4">
            <strong className="text-[13.5px]">Cancellation</strong>
            <div className="text-[12.5px] leading-relaxed text-fg-muted">
              Free until 7 days before departure. 50% back until 48 hours before. Nothing after that — the operator
              has already paid for permits and jeeps.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
