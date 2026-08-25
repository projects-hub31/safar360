import { useState } from 'react';
import { useAdmin } from '../../context/admin/useAdmin';
import { useApp } from '../../context/app/useApp';
import PermGate from '../../components/admin/PermGate';
import { Card, Button, StatusPill, TextField } from '../../components/ui';

const TONE = { open: 'warning', resolved: 'neutral' };
const RESOLUTIONS = [
  { id: 'refund', label: 'Refund traveller in full', variant: 'destructive' },
  { id: 'split', label: 'Split (partial)', variant: 'secondary' },
  { id: 'release', label: 'Release to operator', variant: 'primary' },
];

function fmtAt(at) {
  return at ? new Date(at).toLocaleString('en-PK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : null;
}

export default function Disputes() {
  const { disputes, resolveDispute } = useAdmin();
  const { formatMoney } = useApp();
  const [note, setNote] = useState({});
  const [splitAmount, setSplitAmount] = useState({});
  const [error, setError] = useState({});

  const onResolve = (d, type) => {
    const amount = type === 'split' ? Number(splitAmount[d.id] || 0) : (type === 'refund' ? d.amount : 0);
    const res = resolveDispute(d.id, { type, amount, note: note[d.id] || '' });
    setError((e) => ({ ...e, [d.id]: res.ok ? null : res.error }));
  };

  return (
    <PermGate permKey="disputes">
      <div className="mx-auto flex max-w-[720px] flex-col gap-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Disputes</h1>
        <p className="text-xs leading-relaxed text-fg-subtle">
          Both parties' claims plus an independent cross-module timeline, read from payments/location/vendor events
          rather than trusting either claim alone. A reasoning note is mandatory and shown to both parties.
        </p>

        {disputes.map((d) => (
          <Card key={d.id} className="flex flex-col gap-3 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-sm font-semibold">{d.bookingRef}</span>
              <StatusPill tone={TONE[d.status]}>{d.status}</StatusPill>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1 rounded-lg border border-border-strong bg-raised p-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">Traveller — {d.traveller}</span>
                <p className="text-sm text-fg-muted">{d.travellerClaim}</p>
              </div>
              <div className="flex flex-col gap-1 rounded-lg border border-border-strong bg-raised p-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">Operator — {d.operator}</span>
                <p className="text-sm text-fg-muted">{d.operatorClaim}</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 border-t border-border pt-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">Cross-module timeline</span>
              {d.timeline.map((t) => (
                <div key={t.label} className="flex items-center justify-between text-xs">
                  <span className="text-fg-muted">{t.label} <span className="text-fg-subtle">({t.source})</span></span>
                  {t.at ? <span dir="ltr" className="font-mono">{fmtAt(t.at)}</span> : <StatusPill tone="neutral">Not recorded</StatusPill>}
                </div>
              ))}
            </div>

            <div className="flex justify-between text-sm font-semibold">
              <span>Amount</span>
              <span className="font-mono">{formatMoney(d.amount)}</span>
            </div>

            {d.status === 'open' ? (
              <div className="flex flex-col gap-2 border-t border-border pt-3">
                <TextField
                  label="Reasoning note (shown to both parties)"
                  value={note[d.id] || ''}
                  onChange={(e) => setNote((n) => ({ ...n, [d.id]: e.target.value }))}
                />
                <TextField
                  label="Split amount (only used for Split)"
                  type="number"
                  value={splitAmount[d.id] || ''}
                  onChange={(e) => setSplitAmount((s) => ({ ...s, [d.id]: e.target.value }))}
                />
                {error[d.id] && <span className="text-xs text-danger-text">{error[d.id]}</span>}
                <div className="flex flex-wrap gap-2">
                  {RESOLUTIONS.map((r) => (
                    <Button key={r.id} size="sm" variant={r.variant} disabled={!note[d.id]} onClick={() => onResolve(d, r.id)}>
                      {r.label}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-sunken p-3 text-xs text-fg-muted">
                Resolved — {d.resolution.type}{d.resolution.type === 'split' ? ` (${formatMoney(d.resolution.amount)})` : ''} by {d.resolution.decidedBy}: “{d.resolution.note}”
              </div>
            )}
          </Card>
        ))}
      </div>
    </PermGate>
  );
}
