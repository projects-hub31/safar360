import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/app/useApp';
import { useVendor } from '../../context/vendor/useVendor';
import Card from '../../components/ui/Card';
import StatusPill from '../../components/ui/StatusPill';
import EmptyState from '../../components/ui/EmptyState';
import Countdown from '../../components/ui/Countdown';

const TABS = [
  { id: 'pending', label: 'Waiting' },
  { id: 'accepted', label: 'Answered' },
  { id: 'declined', label: 'Declined' },
  { id: 'all', label: 'All' },
];
const PILL = { pending: 'warning', accepted: 'success', declined: 'danger' };

// Real remaining time to the 24h window's actual deadline, not always a
// fresh 24 hours (§6 vendor/inbox — the clock is real, ownership-scoped
// server state now, controllers/vendor/bookings.controller.js).
function remainingSeconds(deadlineAt) {
  return Math.max(0, Math.round((new Date(deadlineAt).getTime() - Date.now()) / 1000));
}

export default function Inbox() {
  const { formatMoney } = useApp();
  const { inbox, fetchInbox } = useVendor();
  const [tab, setTab] = useState('pending');

  useEffect(() => {
    fetchInbox();
    // Runs once on mount — fetchInbox is stable (useCallback, no deps).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = inbox.filter((r) => tab === 'all' || r.status === tab).slice().reverse();
  const counts = { pending: 0, accepted: 0, declined: 0 };
  inbox.forEach((r) => { if (counts[r.status] !== undefined) counts[r.status] += 1; });

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Booking inbox</h1>

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
          {rows.map((r) => (
            <Link key={r.id} to="/vendor/booking" state={{ requestId: r.id }} className="no-underline">
              <Card className="flex flex-wrap items-center gap-3 p-4 text-fg">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-sm font-bold">{r.title}</span>
                  <span className="text-xs text-fg-muted">{r.seats} seats · {formatMoney(r.price * r.seats)}</span>
                </div>
                <StatusPill tone={PILL[r.status] || 'neutral'}>{r.status}</StatusPill>
                {r.status === 'pending' && (
                  <span className="flex items-center gap-1.5 rounded-md border border-warning bg-warning-soft px-2 py-1 text-[11px] font-semibold text-warning-text">
                    Time to answer <Countdown key={r.id} seconds={remainingSeconds(r.deadlineAt)} urgentAt={21600} />
                  </span>
                )}
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nothing waiting on you"
          body="Requests land here with a 24-hour clock. Answer inside it and travellers keep choosing you."
        />
      )}
    </div>
  );
}
