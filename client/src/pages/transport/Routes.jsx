import { useState } from 'react';
import { useApp } from '../../context/app/useApp';
import { useTransport } from '../../context/transport/useTransport';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import SelectField from '../../components/ui/SelectField';
import ChoiceCard from '../../components/ui/ChoiceCard';
import EmptyState from '../../components/ui/EmptyState';

export default function Routes() {
  const { formatMoney } = useApp();
  const { vehicles, routes, addRoute } = useTransport();
  const [adding, setAdding] = useState(false);
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id || '');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [fareMode, setFareMode] = useState('whole');
  const [fare, setFare] = useState('');
  const [minSeats, setMinSeats] = useState(4);

  const canSave = vehicleId && from.trim() && to.trim() && Number(fare) > 0
    && (fareMode === 'whole' || (fareMode === 'seat' && Number(minSeats) >= 1 && Number(minSeats) <= 12));

  const onAdd = () => {
    if (!canSave) return;
    addRoute({
      vehicleId, from, to, fareMode,
      wholeFare: fareMode === 'whole' ? Number(fare) : null,
      seatFare: fareMode === 'seat' ? Number(fare) : null,
      minSeats: fareMode === 'seat' ? Number(minSeats) : null,
    });
    setFrom(''); setTo(''); setFare(''); setAdding(false);
  };

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Routes</h1>
        <Button size="sm" variant="secondary" onClick={() => setAdding((v) => !v)} disabled={!vehicles.length}>
          {adding ? 'Cancel' : 'Add route'}
        </Button>
      </div>

      <p className="text-xs leading-relaxed text-fg-subtle">
        A route is a pricing sheet, not an inventory object — nothing here holds a seat, reserves a vehicle, or
        takes money. Travellers who enquire against it start a quote (§ Quotes), not a checkout.
      </p>

      {adding && (
        <Card className="flex flex-col gap-3 p-4 sm:p-5">
          <SelectField label="Vehicle" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} options={vehicles.map((v) => ({ value: v.id, label: v.name }))} />
          <div className="flex flex-wrap gap-2.5">
            <TextField label="From" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Gilgit" className="flex-1" />
            <TextField label="To" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Hunza" className="flex-1" />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[12.5px] font-bold text-fg">Fare mode</span>
            <div className="grid grid-cols-2 gap-2">
              <ChoiceCard active={fareMode === 'whole'} onClick={() => setFareMode('whole')} title="Whole vehicle" subtitle="One flat fare for the vehicle" />
              <ChoiceCard active={fareMode === 'seat'} onClick={() => setFareMode('seat')} title="Per seat" subtitle="Fare per passenger, needs a minimum" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <TextField label={fareMode === 'whole' ? 'Flat fare (Rs)' : 'Fare per seat (Rs)'} type="number" min={1} value={fare} onChange={(e) => setFare(e.target.value)} className="w-40" />
            {fareMode === 'seat' && (
              <TextField label="Minimum seats to run" type="number" min={1} max={12} value={minSeats} onChange={(e) => setMinSeats(e.target.value)} className="w-40" />
            )}
          </div>
          <Button onClick={onAdd} disabled={!canSave}>Save route</Button>
        </Card>
      )}

      {routes.length === 0 ? (
        <EmptyState title="No routes yet" body="Add a route to give travellers a price to enquire against." />
      ) : (
        <div className="flex flex-col gap-2.5">
          {routes.map((r) => {
            const vehicle = vehicles.find((v) => v.id === r.vehicleId);
            return (
              <Card key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex flex-col gap-0.5">
                  <strong className="text-sm">{r.from} → {r.to}</strong>
                  <span className="text-xs text-fg-muted">{vehicle?.name || 'Unknown vehicle'}</span>
                </div>
                <div className="text-right">
                  {r.fareMode === 'whole' ? (
                    <span className="font-mono text-sm font-semibold">{formatMoney(r.wholeFare)} flat</span>
                  ) : (
                    <>
                      <span className="font-mono text-sm font-semibold">{formatMoney(r.seatFare)}/seat</span>
                      <div className="text-xs text-fg-muted">min {r.minSeats} to run</div>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
