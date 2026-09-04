import { useEffect } from 'react';
import { useAdmin } from '../../context/admin/useAdmin';
import { useApp } from '../../context/app/useApp';
import PermGate from '../../components/admin/PermGate';
import { Card, Button, StatusPill } from '../../components/ui';

const STATUS_TONE = { held: 'danger', 'ask-id': 'held', cleared: 'success', refunded: 'warning' };

export default function Fraud() {
  const { fraudQueue, policy, fetchFraud, clearFraud, refundFraud, askForId } = useAdmin();
  const { formatMoney } = useApp();

  useEffect(() => { fetchFraud(); }, [fetchFraud]);

  if (!policy) return null;

  return (
    <PermGate permKey="fraud">
      <div className="mx-auto flex max-w-[720px] flex-col gap-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Fraud review</h1>
        <p className="text-xs leading-relaxed text-fg-subtle">
          The model does not decide — it scores and explains. Every score below is a sum of weighted, signed factors,
          never a bare number. The hold threshold is read live from Policy config, currently{' '}
          <span className="font-mono font-semibold">{policy.fraudThreshold.toFixed(2)}</span>.
        </p>

        {fraudQueue.map((row) => {
          const wouldHold = row.score >= policy.fraudThreshold;
          return (
            <Card key={row.id} className="flex flex-col gap-3 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="font-mono text-sm font-semibold">{row.bookingRef}</span>
                  <span className="text-xs text-fg-muted">{row.traveller} · {formatMoney(row.amount)}{row.linkedLedgerRef ? ` · linked to ${row.linkedLedgerRef}` : ''}</span>
                </div>
                <StatusPill tone={STATUS_TONE[row.status]}>{row.status === 'ask-id' ? 'awaiting ID' : row.status}</StatusPill>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border-strong bg-raised px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">Score</span>
                <span className={`font-mono text-base font-bold ${wouldHold ? 'text-danger-text' : 'text-success-text'}`}>
                  {row.score.toFixed(2)} {wouldHold ? '— above threshold' : '— below threshold'}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                {(row.factors || []).map((f) => (
                  <div key={f.label} className="flex items-center justify-between text-xs">
                    <span className="text-fg-muted">{f.label}</span>
                    <span className={`font-mono font-semibold ${f.weight >= 0 ? 'text-danger-text' : 'text-success-text'}`}>
                      {f.weight >= 0 ? '+' : ''}{f.weight.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {(row.status === 'held' || row.status === 'ask-id') && (
                <div className="flex flex-wrap gap-2 border-t border-border pt-2.5">
                  <Button size="sm" onClick={() => clearFraud(row.id)}>Clear — confirm payment</Button>
                  <Button size="sm" variant="destructive" onClick={() => refundFraud(row.id)}>Refund</Button>
                  <Button size="sm" variant="secondary" onClick={() => askForId(row.id)} disabled={row.status === 'ask-id'}>Ask for ID</Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </PermGate>
  );
}
