import { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { useTransport } from '../../context/useTransport';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import Stepper from '../../components/ui/Stepper';
import StatusPill from '../../components/ui/StatusPill';
import vehJeep from '../../assets/traveler/veh-jeep.jpg';

export default function Transport() {
  const { user } = useAuth();
  const { vehicles, createLead } = useTransport();
  const vehicle = vehicles[0];

  const [date, setDate] = useState('');
  const [passengers, setPassengers] = useState(2);
  const [note, setNote] = useState('');
  const [sentId, setSentId] = useState(null);

  const onSend = () => {
    if (!date) return;
    const id = createLead({
      kind: 'transport',
      subjectId: vehicle.id,
      subjectLabel: `${vehicle.name} · Gilgit → Hunza`,
      name: user?.name || 'Traveller',
      date,
      count: passengers,
      note,
    });
    setSentId(id);
  };

  return (
    <div className="mx-auto grid max-w-[720px] items-start gap-4 lg:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-3.5">
        <img
          src={vehJeep}
          alt="4x4 jeep parked on a mountain track"
          className="aspect-[4/3] w-full rounded-2xl object-cover"
        />
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-[30px]">
            {vehicle.name} · Gilgit → Hunza
          </h1>
          <div className="text-[13px] text-fg-muted">{vehicle.type} · {vehicle.capacity} seats · verified owner</div>
        </div>
        <div className="rounded-2xl border border-info bg-info-soft px-4 py-3 text-[13px] leading-relaxed text-info-text">
          This is an enquiry, not a booking. Nothing is charged and no seat is held — the owner replies within 24
          hours with a priced quote you can then accept.
        </div>
      </div>

      <div className="flex flex-col gap-3.5 rounded-2xl border border-border bg-surface p-4 sm:p-5">
        {sentId ? (
          <div className="flex flex-col items-start gap-2">
            <StatusPill tone="success">Enquiry sent</StatusPill>
            <p className="text-sm leading-relaxed text-fg-muted">
              The owner has 24 hours to reply with a quote. You haven't been charged and no seat has been held.
            </p>
          </div>
        ) : (
          <>
            <strong className="text-sm">Send an enquiry</strong>
            <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <div className="flex flex-col gap-1">
              <span className="text-[12.5px] font-bold text-fg">Passengers</span>
              <Stepper value={passengers} onChange={setPassengers} min={1} max={vehicle.capacity} srLabel="passenger" />
            </div>
            <TextField label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Pickup point, luggage, timing…" />
            <Button onClick={onSend} disabled={!date} size="lg" fullWidth>
              Send enquiry
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
