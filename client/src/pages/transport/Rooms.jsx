import { useState } from 'react';
import { useApp } from '../../context/app/useApp';
import { useTransport } from '../../context/transport/useTransport';
import { SEASON_MULTIPLIERS } from '../../context/transport/transport-context';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import ChoiceCard from '../../components/ui/ChoiceCard';

const SEASONS = [
  { id: 'shoulder', label: 'Shoulder', hint: '×1.0' },
  { id: 'peak', label: 'Peak', hint: '×1.4' },
  { id: 'winter', label: 'Winter', hint: '×0.6' },
];

export default function Rooms() {
  const { formatMoney } = useApp();
  const { rooms, setRoomTotal, addRoom } = useTransport();
  const [season, setSeason] = useState('shoulder');
  const [floorNote, setFloorNote] = useState(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(2);
  const [nightlyRate, setNightlyRate] = useState('');
  const [total, setTotal] = useState(1);

  const onSetTotal = (id, value) => {
    const result = setRoomTotal(id, Number(value));
    if (!result.ok) {
      setFloorNote({ id, floor: result.floor });
      setTimeout(() => setFloorNote(null), 4000);
    }
  };

  const onAddRoom = () => {
    if (!name.trim() || !(Number(nightlyRate) > 0)) return;
    addRoom({ name, capacity: Number(capacity), nightlyRate: Number(nightlyRate), total: Number(total) });
    setName(''); setNightlyRate(''); setCapacity(2); setTotal(1); setAdding(false);
  };

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Rooms</h1>
        <Button size="sm" variant="secondary" onClick={() => setAdding((v) => !v)}>
          {adding ? 'Cancel' : 'Add room type'}
        </Button>
      </div>

      {adding && (
        <Card className="flex flex-col gap-3 p-4 sm:p-5">
          <TextField label="Room type name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Valley-facing double" />
          <div className="flex flex-wrap gap-2.5">
            <TextField label="Guests" type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} className="w-28" />
            <TextField label="Nightly rate (Rs)" type="number" min={1} value={nightlyRate} onChange={(e) => setNightlyRate(e.target.value)} className="w-40" />
            <TextField label="Total rooms" type="number" min={0} value={total} onChange={(e) => setTotal(e.target.value)} className="w-28" />
          </div>
          <Button onClick={onAddRoom} disabled={!name.trim() || !(Number(nightlyRate) > 0)}>Save room type</Button>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-[12.5px] font-bold text-fg">Preview season</span>
        <div className="grid grid-cols-3 gap-2">
          {SEASONS.map((s) => (
            <ChoiceCard key={s.id} active={season === s.id} onClick={() => setSeason(s.id)} title={s.label} subtitle={s.hint} />
          ))}
        </div>
        <p className="text-xs leading-relaxed text-fg-subtle">
          A traveller only ever sees one final computed nightly rate — never a base rate plus a separate surcharge line.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {rooms.map((r) => {
          const computed = Math.round(r.nightlyRate * SEASON_MULTIPLIERS[season]);
          return (
            <Card key={r.id} className="flex flex-col gap-2.5 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <strong className="text-sm">{r.name}</strong>
                  <span className="text-xs text-fg-muted">{r.capacity} guests</span>
                </div>
                <span className="font-mono text-[15px] font-semibold">{formatMoney(computed)}/night</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 border-t border-border pt-2.5">
                <TextField
                  label="Total rooms of this type"
                  aria-label={`Total rooms for ${r.name}`}
                  type="number"
                  min={r.booked}
                  value={r.total}
                  onChange={(e) => onSetTotal(r.id, e.target.value)}
                  className="w-40"
                />
                <span className="text-xs text-fg-muted">{r.booked} currently booked</span>
              </div>
              {floorNote?.id === r.id && (
                <span className="text-xs text-danger-text">
                  You can't set the count below {floorNote.floor} — that many rooms of this type are already booked.
                </span>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
