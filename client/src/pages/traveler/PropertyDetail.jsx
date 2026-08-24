import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/useApp';
import { useAuth } from '../../context/useAuth';
import { useTransport } from '../../context/useTransport';
import { seatPill } from '../../data/traveler/tours';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';
import TextField from '../../components/ui/TextField';
import Stepper from '../../components/ui/Stepper';
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
  const { user } = useAuth();
  const { createLead } = useTransport();
  const [enquiring, setEnquiring] = useState(false);
  const [kind, setKind] = useState('table');
  const [date, setDate] = useState('');
  const [guests, setGuests] = useState(2);
  const [note, setNote] = useState('');
  const [sentId, setSentId] = useState(null);

  const onSendEnquiry = () => {
    if (!date) return;
    const id = createLead({
      kind,
      subjectId: null,
      subjectLabel: kind === 'table' ? 'Dinner table enquiry' : 'Group event enquiry',
      name: user?.name || 'Traveller',
      date,
      count: guests,
      note,
    });
    setSentId(id);
  };

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

        <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-surface p-4">
          <strong className="text-sm">Table or group event</strong>
          {sentId ? (
            <div className="flex flex-col items-start gap-1.5">
              <StatusPill tone="success">Enquiry sent</StatusPill>
              <p className="text-[13px] leading-relaxed text-fg-muted">
                No table is held and nothing is charged. The property has 24 hours to reply with a quote.
              </p>
            </div>
          ) : enquiring ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant={kind === 'table' ? 'primary' : 'secondary'} onClick={() => setKind('table')}>Dinner table</Button>
                <Button size="sm" variant={kind === 'group' ? 'primary' : 'secondary'} onClick={() => setKind('group')}>Group event</Button>
              </div>
              <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <div className="flex flex-col gap-1">
                <span className="text-[12.5px] font-bold text-fg">Guests</span>
                <Stepper value={guests} onChange={setGuests} min={1} max={40} srLabel="guest" />
              </div>
              <TextField label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Occasion, dietary needs, timing…" />
              <Button onClick={onSendEnquiry} disabled={!date}>Send enquiry</Button>
            </div>
          ) : (
            <>
              <p className="text-[13px] leading-relaxed text-fg-muted">
                No table is held, no room is blocked, and no payment is taken — the property replies with a quote.
              </p>
              <Button size="sm" variant="secondary" className="self-start" onClick={() => setEnquiring(true)}>
                Ask about a table or group booking
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
