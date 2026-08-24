import { Link } from 'react-router-dom';
import { useApp } from '../../context/useApp';
import { seatPill } from '../../data/traveler/tours';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';
import propLodge from '../../assets/traveler/prop-lodge.jpg';
import propRoom from '../../assets/traveler/prop-room.jpg';

const ROOMS = [
  { name: 'Valley-facing double', meta: 'Rakaposhi view · wood stove · 2 guests', price: 14500, left: 2 },
  { name: 'Twin with shared bath', meta: '2 single beds · hot water 6–10 pm', price: 8900, left: 5 },
  { name: 'Family suite', meta: '2 rooms · 4 guests · balcony', price: 22000, left: 0 },
];

const HOUSE_RULES = [
  { label: 'Check in', value: '2:00 pm — 10:00 pm' },
  { label: 'Check out', value: 'by 11:00 am' },
  { label: 'Power', value: 'Generator 6 pm — midnight' },
  { label: 'Payment', value: 'Card, JazzCash, cash on arrival' },
];

export default function PropertyDetail() {
  const { formatMoney } = useApp();

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-3.5">
        <img
          src={propLodge}
          alt="Stone lodge above the Hunza valley"
          className="aspect-[3/2] w-full rounded-2xl object-cover"
          style={{ filter: 'saturate(.9) contrast(1.07) hue-rotate(-8deg)' }}
        />
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-[30px]">
            Eagle’s Nest Lodge · Duikar, Hunza
          </h1>
          <div className="text-[13px] text-fg-muted">
            <span className="font-mono font-semibold text-fg">★ 4.7</span> · 214 reviews · 2,850 m · 40 min from
            Karimabad
          </div>
        </div>
        <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-surface p-4">
          <strong className="text-sm">House rules</strong>
          <div className="grid grid-cols-1 gap-2.5 text-[13px] leading-relaxed text-fg-muted sm:grid-cols-2">
            {HOUSE_RULES.map((r) => (
              <div key={r.label}>
                <strong className="text-fg">{r.label}</strong>
                <br />
                {r.value}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3.5">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="border-b border-border px-4 py-3 text-[14.5px] font-bold">Rooms</div>
          {ROOMS.map((r) => {
            const pill = seatPill(r.left);
            const gone = r.left <= 0;
            return (
              <div key={r.name} className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 last:border-0">
                <img
                  src={propRoom}
                  alt="Room interior"
                  loading="lazy"
                  className="h-[60px] w-[76px] flex-none rounded-lg object-cover"
                  style={{ filter: 'saturate(.9) contrast(1.07) hue-rotate(-8deg)' }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-bold">{r.name}</div>
                  <div className="text-xs leading-relaxed text-fg-muted">{r.meta}</div>
                </div>
                <div className="flex flex-none flex-col items-end gap-1">
                  <span className="font-mono text-[15px] font-semibold">{formatMoney(r.price)}</span>
                  <StatusPill tone={pill.tone}>{gone ? 'Fully booked' : `${r.left} left`}</StatusPill>
                </div>
                <Button to="/booking/checkout" disabled={gone} size="sm">
                  {gone ? 'Unavailable' : 'Reserve'}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4">
          <strong className="text-sm">Kitchen</strong>
          <div className="text-[13px] leading-relaxed text-fg-muted">
            Chapshuro Rs 650 · Hunza walnut cake Rs 450 · Daal chawal Rs 550 · Yak karahi (order by 4 pm) Rs 2,200
          </div>
          <Link to="/transport/menu" className="w-fit text-[13px] font-semibold no-underline">
            Full menu
          </Link>
        </div>
      </div>
    </div>
  );
}
