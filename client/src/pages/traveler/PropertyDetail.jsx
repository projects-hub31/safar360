import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/app/useApp';
import { useAuth } from '../../context/auth/useAuth';
import { useTransport } from '../../context/transport/useTransport';
import { roomRate } from '../../context/transport/transport-context';
import { seatPill } from '../../data/traveler/tours';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';
import TextField from '../../components/ui/TextField';
import Stepper from '../../components/ui/Stepper';
import ChoiceCard from '../../components/ui/ChoiceCard';
import propLodge from '../../assets/traveler/prop-lodge.jpg';
import propRoom from '../../assets/traveler/prop-room.jpg';

const HOUSE_RULES = [
  { label: 'Check in', value: '2:00 pm — 10:00 pm' },
  { label: 'Check out', value: 'by 11:00 am' },
  { label: 'Power', value: 'Generator 6 pm — midnight' },
  { label: 'Payment', value: 'Card, JazzCash, cash on arrival' },
];

const METHODS = [
  { id: 'jazzcash', name: 'JazzCash', field: 'Mobile account number', placeholder: '0300 4821776' },
  { id: 'easypaisa', name: 'EasyPaisa', field: 'Mobile account number', placeholder: '0345 2210094' },
  { id: 'card', name: 'Card', field: 'Card number', placeholder: '4242 4242 4242 4242' },
];

function todayPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function PropertyDetail() {
  const { formatMoney } = useApp();
  const { user } = useAuth();
  const { createLead, rooms, bookRoom, roomBookings, cancelRoomBooking } = useTransport();

  // --- room reservation (real payment, real availability — §6 "Rooms are
  // booked, enquiries are not") ------------------------------------------
  const [openRoomId, setOpenRoomId] = useState(null);
  // Lazy initializer — `todayPlus` touches `new Date()`, so it must not run
  // as a plain (eagerly evaluated) useState argument on every render (§7
  // react-hooks/purity convention), even though only the mount-time value
  // is ever actually used.
  const [checkIn, setCheckIn] = useState(() => todayPlus(7));
  const [nights, setNights] = useState(2);
  const [roomGuests, setRoomGuests] = useState(2);
  const [method, setMethod] = useState(null);
  const [detail, setDetail] = useState('');
  const [processing, setProcessing] = useState(false);
  const [roomResult, setRoomResult] = useState(null); // { roomId, kind, ref, reason }

  const guestName = user?.name || 'Traveller';
  const myReservations = roomBookings.filter((b) => b.guestName === guestName);

  const openRoom = rooms.find((r) => r.id === openRoomId);
  const previewRate = openRoom ? roomRate(openRoom.nightlyRate, checkIn) : 0;
  const activeMethod = METHODS.find((m) => m.id === method);
  const canReserve = method && detail.trim().length >= 5;

  const onOpenRoom = (roomId) => {
    setOpenRoomId(roomId === openRoomId ? null : roomId);
    setMethod(null);
    setDetail('');
    setRoomResult(null);
  };

  const onReserve = () => {
    if (!openRoom || !canReserve || processing) return;
    setProcessing(true);
    setTimeout(() => {
      const result = bookRoom({
        roomId: openRoom.id, checkIn, nights, guests: roomGuests,
        method, methodDetail: detail, guestName,
      });
      setProcessing(false);
      setRoomResult({ roomId: openRoom.id, ...result });
      if (result.kind === 'confirmed') setOpenRoomId(null);
    }, 1200);
  };

  // --- table / group enquiry (lead, not a booking — §6) -------------------
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
      name: guestName,
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

        {myReservations.length > 0 && (
          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4">
            <strong className="text-sm">Your reservations here</strong>
            {myReservations.map((b) => (
              <div key={b.ref} className="flex flex-wrap items-center gap-2.5 border-t border-border pt-2.5 first:border-0 first:pt-0">
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-bold">{b.roomName}</div>
                  <div dir="ltr" className="font-mono text-xs text-fg-muted">
                    {b.ref} · {b.checkIn} · {b.nights} night{b.nights === 1 ? '' : 's'}
                  </div>
                </div>
                <span className="font-mono text-sm font-semibold">{formatMoney(b.total)}</span>
                {b.state === 'confirmed' ? (
                  <>
                    <StatusPill tone="success">Confirmed</StatusPill>
                    <Button size="sm" variant="secondary" onClick={() => cancelRoomBooking(b.ref)}>Cancel</Button>
                  </>
                ) : (
                  <StatusPill tone="neutral">Cancelled</StatusPill>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3.5">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <span className="text-[14.5px] font-bold">Rooms</span>
          </div>
          <div className="grid grid-cols-2 gap-2 border-b border-border px-4 py-3">
            <TextField label="Check-in" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
            <div className="flex flex-col gap-1">
              <span className="text-[12.5px] font-bold text-fg">Nights</span>
              <Stepper value={nights} onChange={setNights} min={1} max={14} srLabel="night" />
            </div>
          </div>

          {rooms.map((r) => {
            const left = r.total - r.booked;
            const pill = seatPill(left);
            const gone = left <= 0;
            const rate = roomRate(r.nightlyRate, checkIn);
            const isOpen = openRoomId === r.id;
            const result = roomResult?.roomId === r.id ? roomResult : null;

            return (
              <div key={r.id} className="border-b border-border px-4 py-3 last:border-0">
                <div className="flex flex-wrap items-center gap-3">
                  <img
                    src={propRoom}
                    alt="Room interior"
                    loading="lazy"
                    className="h-[60px] w-[76px] flex-none rounded-lg object-cover"
                    style={{ filter: 'saturate(.9) contrast(1.07) hue-rotate(-8deg)' }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-bold">{r.name}</div>
                    <div className="text-xs leading-relaxed text-fg-muted">Up to {r.capacity} guests</div>
                  </div>
                  <div className="flex flex-none flex-col items-end gap-1">
                    <span className="font-mono text-[15px] font-semibold">{formatMoney(rate)}<span className="font-normal text-fg-muted"> /night</span></span>
                    <StatusPill tone={pill.tone}>{gone ? 'Fully booked' : `${left} left`}</StatusPill>
                  </div>
                  <Button onClick={() => onOpenRoom(r.id)} disabled={gone} size="sm">
                    {gone ? 'Unavailable' : isOpen ? 'Close' : 'Reserve'}
                  </Button>
                </div>

                {isOpen && (
                  <div className="mt-3 flex flex-col gap-3 rounded-xl border border-border-strong bg-raised p-3.5">
                    <div className="flex flex-col gap-1">
                      <span className="text-[12.5px] font-bold text-fg">Guests</span>
                      <Stepper value={roomGuests} onChange={setRoomGuests} min={1} max={r.capacity} srLabel="guest" />
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {METHODS.map((m) => (
                        <ChoiceCard key={m.id} active={method === m.id} onClick={() => { setMethod(m.id); setDetail(''); }} title={m.name} subtitle={m.field} />
                      ))}
                    </div>
                    {activeMethod && (
                      <TextField label={activeMethod.field} dir="ltr" value={detail} onChange={(e) => setDetail(e.target.value)} placeholder={activeMethod.placeholder} />
                    )}
                    <div className="flex items-center justify-between border-t border-border pt-2.5 text-sm font-bold">
                      <span>{nights} night{nights === 1 ? '' : 's'} × {formatMoney(previewRate)}</span>
                      <span className="font-mono">{formatMoney(previewRate * nights)}</span>
                    </div>
                    {result && result.kind !== 'confirmed' && (
                      <p className="text-xs text-danger-text">{result.reason}</p>
                    )}
                    <Button onClick={onReserve} disabled={!canReserve} loading={processing} fullWidth>
                      {processing ? 'Processing…' : `Pay & reserve — ${formatMoney(previewRate * nights)}`}
                    </Button>
                  </div>
                )}
                {result?.kind === 'confirmed' && !isOpen && (
                  <p className="mt-2 text-xs text-success-text">Reserved — reference {result.ref}. See "Your reservations here" on the left.</p>
                )}
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
              <Link to="/discover/enquiries" className="text-[13px] font-semibold text-primary-soft-text no-underline">
                View my enquiries →
              </Link>
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
