import { useState } from 'react';
import { useAdmin } from '../../context/admin/useAdmin';
import { useApp } from '../../context/app/useApp';
import { POLICY_FIELDS, fraudScore } from '../../context/admin/admin-context';
import PermGate from '../../components/admin/PermGate';
import { Card, Button } from '../../components/ui';

const SAMPLE_BOOKING = 226500;

function effectPreview(key, draft, fraudQueue, formatMoney) {
  switch (key) {
    case 'fraudThreshold':
      return (
        <ul className="flex flex-col gap-1">
          {fraudQueue.map((row) => {
            const score = fraudScore(row);
            const held = score >= draft.fraudThreshold;
            return (
              <li key={row.id} className="flex justify-between font-mono">
                <span>{row.bookingRef} (score {score.toFixed(2)})</span>
                <span className={held ? 'text-danger-text' : 'text-success-text'}>{held ? 'would be held' : 'would pass'}</span>
              </li>
            );
          })}
        </ul>
      );
    case 'commissionPct':
      return `A Rs ${SAMPLE_BOOKING.toLocaleString('en-US')} booking, at the default rate, nets a vendor ${formatMoney(SAMPLE_BOOKING - Math.round(SAMPLE_BOOKING * draft.commissionPct / 100))} — plan/seller-specific rates still override this.`;
    case 'referralPct':
      return `An influencer earns ${formatMoney(Math.round(SAMPLE_BOOKING * draft.referralPct / 100))} on that same booking.`;
    case 'attributionDays':
      return `A referral click today stays credited through ${new Date(Date.now() + draft.attributionDays * 86400000).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}.`;
    case 'cancelFreeHours':
      return `A flexible-policy booking cancelled ${draft.cancelFreeHours}h or more before departure refunds 100%; inside that window, the listing's own tiered schedule applies.`;
    case 'weatherDecisionHours':
      return `An operator gets ${draft.weatherDecisionHours}h after a weather alert to proceed/postpone/cancel — no decision auto-postpones.`;
    case 'weatherRefundPct':
      return `A weather cancellation on that Rs ${SAMPLE_BOOKING.toLocaleString('en-US')} booking today refunds ${formatMoney(Math.round(SAMPLE_BOOKING * draft.weatherRefundPct / 100))}.`;
    default:
      return null;
  }
}

export default function Config() {
  const { policy, savePolicy, fraudQueue } = useAdmin();
  const { formatMoney } = useApp();
  const [draft, setDraft] = useState(policy);

  const dirty = POLICY_FIELDS.some((f) => draft[f.key] !== policy[f.key]);

  const onSave = () => {
    const changed = POLICY_FIELDS.filter((f) => draft[f.key] !== policy[f.key])
      .map((f) => `${f.key} ${policy[f.key]} → ${draft[f.key]}`)
      .join(', ');
    if (!changed) return;
    savePolicy(draft, changed);
  };

  return (
    <PermGate permKey="config">
      <div className="mx-auto flex max-w-[720px] flex-col gap-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Policy config</h1>
        <div className="rounded-xl border border-info bg-info-soft px-4 py-3 text-[13px] leading-relaxed text-info-text">
          Every default below is my proposal, not a decision — these are meant to be genuinely operator-tunable,
          never hardcoded launch values.
        </div>

        {POLICY_FIELDS.map((f) => (
          <Card key={f.key} className="flex flex-col gap-2.5 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">{f.label}</span>
              <span className="font-mono text-sm font-bold">{draft[f.key]}{f.unit}</span>
            </div>
            <input
              type="range"
              min={f.min}
              max={f.max}
              step={f.step}
              value={draft[f.key]}
              onChange={(e) => setDraft((d) => ({ ...d, [f.key]: Number(e.target.value) }))}
              className="w-full accent-primary"
              aria-label={f.label}
            />
            <span className="text-xs text-fg-muted">{f.hint}</span>
            <div className="rounded-lg border border-border-strong bg-raised p-2.5 text-xs text-fg-muted">
              {effectPreview(f.key, draft, fraudQueue, formatMoney)}
            </div>
          </Card>
        ))}

        <div className="sticky bottom-3">
          <Button fullWidth disabled={!dirty} onClick={onSave}>
            {dirty ? 'Save policy changes' : 'No changes to save'}
          </Button>
        </div>
      </div>
    </PermGate>
  );
}
