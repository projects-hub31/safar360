import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/app/useApp';
import { useTransport } from '../../context/transport/useTransport';
import Card from '../../components/ui/Card';
import StatusPill from '../../components/ui/StatusPill';
import EmptyState from '../../components/ui/EmptyState';
import Countdown from '../../components/ui/Countdown';

const TABS = [
  { id: 'request', label: 'Awaiting' },
  { id: 'quoted', label: 'Quoted' },
  { id: 'declined', label: 'Declined' },
];
const PILL = { request: 'warning', quoted: 'info', declined: 'danger', accepted: 'success', expired: 'neutral', withdrawn: 'neutral' };

// Real remaining time to the lead's actual deadline, not always a fresh 24h
// (§6 quotes inbox — the clock is real, ownership-scoped server state now).
function remainingSeconds(deadlineAt) {
  return Math.max(0, Math.round((deadlineAt - Date.now()) / 1000));
}

export default function Quotes() {
  const { formatMoney } = useApp();
  const { leads, fetchLeadsInbox } = useTransport();
  const [tab, setTab] = useState('request');

  useEffect(() => {
    fetchLeadsInbox();
    // Runs once on mount — fetchLeadsInbox is stable (useCallback, no deps).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const transportLeads = leads.filter((l) => l.kind === 'transport');
  const rows = transportLeads.filter((l) => l.status === tab).slice().reverse();
  const counts = { request: 0, quoted: 0, declined: 0 };
  transportLeads.forEach((l) => { if (counts[l.status] !== undefined) counts[l.status] += 1; });

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Quotes</h1>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={`min-h-9 rounded-lg border px-3 text-[13px] font-semibold ${
              tab === t.id ? 'border-primary bg-primary-soft text-primary-soft-text' : 'border-border-strong bg-surface text-fg'
            }`}
          >
            {t.label}{counts[t.id] ? ` (${counts[t.id]})` : ''}
          </button>
        ))}
      </div>

      {rows.length ? (
        <div className="flex flex-col gap-2.5">
          {rows.map((l) => (
            <Link key={l.id} to="/transport/quote" state={{ leadId: l.id }} className="no-underline">
              <Card className="flex flex-wrap items-center gap-3 p-4 text-fg">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-sm font-bold">{l.subjectLabel}</span>
                  <span className="text-xs text-fg-muted">{l.name} · {l.date} · {l.count} passengers</span>
                </div>
                {l.status === 'quoted' && <span className="font-mono text-sm font-semibold">{formatMoney(l.quote.total)}</span>}
                <StatusPill tone={PILL[l.status] || 'neutral'}>{l.status}</StatusPill>
                {l.status === 'request' && (
                  <span className="flex items-center gap-1.5 rounded-md border border-warning bg-warning-soft px-2 py-1 text-[11px] font-semibold text-warning-text">
                    Reply within <Countdown key={l.id} seconds={remainingSeconds(l.deadlineAt)} urgentAt={21600} />
                  </span>
                )}
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nothing here"
          body="Traveller enquiries land as Awaiting with a 24-hour reply clock. Send a quote and travellers keep choosing you."
        />
      )}
    </div>
  );
}
