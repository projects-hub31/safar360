import { useEffect, useState } from 'react';
import { useTransport } from '../../context/transport/useTransport';
import { daysLeftStatus, vehicleVisible } from '../../context/transport/transport-context';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import StatusPill from '../../components/ui/StatusPill';
import Toggle from '../../components/ui/Toggle';

export default function Vehicles() {
  const { vehicles, permits, fetchVehicles, fetchPermits, addVehicle, toggleVehicleActive } = useTransport();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [capacity, setCapacity] = useState(4);

  useEffect(() => {
    fetchVehicles();
    fetchPermits();
    // Runs once on mount — both actions are stable (useCallback, no deps).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real KYC review doesn't cover the `transport` role yet (server/src/
  // controllers/discover/vehicles.controller.js's own note) — always true
  // here rather than reading a `kycStatus` that can never reach 'approved'.
  const kycApproved = true;

  const onAdd = async () => {
    if (!name.trim() || !type.trim()) return;
    await addVehicle({ name, type, capacity: Number(capacity) });
    setName(''); setType(''); setCapacity(4); setAdding(false);
  };

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Vehicles</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" to="/transport/routes">Routes</Button>
          <Button size="sm" variant="secondary" onClick={() => setAdding((v) => !v)}>
            {adding ? 'Cancel' : 'Add vehicle'}
          </Button>
        </div>
      </div>

      {adding && (
        <Card className="flex flex-col gap-3 p-4 sm:p-5">
          <TextField label="Vehicle name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Toyota Land Cruiser" />
          <TextField label="Type & seats label" value={type} onChange={(e) => setType(e.target.value)} placeholder="Jeep · 4×4" />
          <TextField label="Capacity" type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} className="w-32" />
          <Button onClick={onAdd} disabled={!name.trim() || !type.trim()}>Save vehicle</Button>
        </Card>
      )}

      <div className="flex flex-col gap-2.5">
        {vehicles.map((v) => {
          const permit = permits.find((p) => p.id === v.permitId);
          const permitStatus = permit ? daysLeftStatus(permit.daysLeft) : null;
          const visible = vehicleVisible(v, permits, kycApproved);
          return (
            <Card key={v.id} className="flex flex-col gap-2.5 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <strong className="text-sm">{v.name}</strong>
                  <span className="text-xs text-fg-muted">{v.type} · {v.capacity} seats</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {v.needsPermit && permitStatus && <StatusPill tone={permitStatus.tone}>Permit {permitStatus.label.toLowerCase()}</StatusPill>}
                  <StatusPill tone={visible ? 'success' : 'neutral'}>{visible ? 'Visible in search' : 'Hidden from search'}</StatusPill>
                </div>
              </div>
              <div className="border-t border-border pt-2.5">
                <Toggle
                  id={`active-${v.id}`}
                  checked={v.active}
                  onChange={() => toggleVehicleActive(v.id)}
                  label={v.active ? 'Listed' : 'Paused'}
                  description={v.active ? 'Travellers can request quotes for this vehicle.' : 'Paused — hidden from search until you resume it.'}
                />
              </div>
            </Card>
          );
        })}
      </div>

      <p className="text-xs leading-relaxed text-fg-subtle">
        A vehicle needs an active toggle, an approved permit (if one applies), and your KYC approved to show up in
        search — pausing or letting a permit lapse hides it immediately, but never cancels a quote already accepted.
      </p>
    </div>
  );
}
