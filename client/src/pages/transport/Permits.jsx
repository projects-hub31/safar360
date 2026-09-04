import { useEffect, useState } from 'react';
import { useTransport } from '../../context/transport/useTransport';
import { daysLeftStatus, PERMIT_WARNING_DAYS } from '../../context/transport/transport-context';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import SelectField from '../../components/ui/SelectField';
import StatusPill from '../../components/ui/StatusPill';
import EmptyState from '../../components/ui/EmptyState';

export default function Permits() {
  const { vehicles, permits, fetchVehicles, fetchPermits, addPermit, renewPermit } = useTransport();
  const [adding, setAdding] = useState(false);
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id || '');
  const [number, setNumber] = useState('');
  const [region, setRegion] = useState('Gilgit-Baltistan');
  const [daysLeft, setDaysLeft] = useState(365);

  useEffect(() => {
    fetchVehicles();
    fetchPermits();
    // Runs once on mount — both actions are stable (useCallback, no deps).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onAdd = async () => {
    if (!vehicleId || !number.trim()) return;
    await addPermit({ vehicleId, number, region, daysLeft: Number(daysLeft) });
    setNumber(''); setAdding(false);
  };

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Permits</h1>
        <Button size="sm" variant="secondary" onClick={() => setAdding((v) => !v)} disabled={!vehicles.length}>
          {adding ? 'Cancel' : 'Add permit'}
        </Button>
      </div>

      {adding && (
        <Card className="flex flex-col gap-3 p-4 sm:p-5">
          <SelectField label="Vehicle" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} options={vehicles.map((v) => ({ value: v.id, label: v.name }))} />
          <TextField label="Permit number" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="GB-DNP-2026-0881" />
          <SelectField
            label="Region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            options={['Gilgit-Baltistan', 'Khyber Pakhtunkhwa', 'Azad Kashmir', 'Balochistan'].map((r) => ({ value: r, label: r }))}
          />
          <TextField label="Days until expiry" type="number" min={0} value={daysLeft} onChange={(e) => setDaysLeft(e.target.value)} className="w-32" />
          <Button onClick={onAdd} disabled={!vehicleId || !number.trim()}>Save permit</Button>
        </Card>
      )}

      {permits.length === 0 ? (
        <EmptyState title="No permits on file" body="Add a route permit to let its linked vehicle appear in search." />
      ) : (
        <div className="flex flex-col gap-2.5">
          {permits.map((p) => {
            const vehicle = vehicles.find((v) => v.id === p.vehicleId);
            const status = daysLeftStatus(p.daysLeft);
            return (
              <Card key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex flex-col gap-0.5">
                  <strong className="font-mono text-sm">{p.number}</strong>
                  <span className="text-xs text-fg-muted">{vehicle?.name || 'Unknown vehicle'} · {p.region}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill tone={status.tone}>{status.label} · {p.daysLeft}d</StatusPill>
                  {status.label !== 'Valid' && (
                    <Button size="sm" variant="secondary" onClick={() => renewPermit(p.id)}>Renew</Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs leading-relaxed text-fg-subtle">
        A permit under {PERMIT_WARNING_DAYS} days shows as expiring; at zero it withdraws its route from search —
        it never cancels a booking already taken on that route.
      </p>
    </div>
  );
}
