import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/useApp';
import { useBooking } from '../../context/useBooking';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';
import EmptyState from '../../components/ui/EmptyState';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const PILL = { confirmed: 'success', cancelled: 'neutral' };

export default function History() {
  const { formatMoney } = useApp();
  const { bookings } = useBooking();
  const [tab, setTab] = useState('all');

  const rows = bookings.filter((b) => tab === 'all' || b.state === tab).slice().reverse();

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Booking history</h1>
          <p className="text-sm text-fg-muted">
            {bookings.length} booking{bookings.length === 1 ? '' : 's'} on this account.
          </p>
        </div>
        <Link to="/discover/enquiries" className="text-sm font-semibold text-primary-soft-text no-underline">
          My enquiries →
        </Link>
      </div>

      <div className="flex gap-1.5">
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
            {t.label}
          </button>
        ))}
      </div>

      {rows.length ? (
        <div className="flex flex-col gap-2.5">
          {rows.map((b) => (
            <Card key={b.ref} className="flex flex-wrap items-center gap-3 p-4">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-bold">{b.title}</span>
                <span dir="ltr" className="font-mono text-xs text-fg-muted">
                  {b.ref} · {b.seats} seat{b.seats === 1 ? '' : 's'}
                </span>
              </div>
              <span className="font-mono text-sm font-semibold">{formatMoney(b.total)}</span>
              <StatusPill tone={PILL[b.state] || 'neutral'}>{b.state}</StatusPill>
              {b.state === 'confirmed' && (
                <Button to={`/booking/cancel/${b.ref}`} size="sm" variant="secondary">Cancel</Button>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nothing here yet"
          body="Bookings, filters and receipts land here once you book something."
          actionLabel="Browse trips"
          actionTo="/discover/search"
        />
      )}
    </div>
  );
}
