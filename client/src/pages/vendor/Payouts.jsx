import { Link } from 'react-router-dom';
import { useVendor } from '../../context/useVendor';
import { useApp } from '../../context/useApp';
import Card from '../../components/ui/Card';
import StatusPill from '../../components/ui/StatusPill';
import EmptyState from '../../components/ui/EmptyState';

const BUCKETS = [
  { state: 'accruing', label: 'Accruing', tone: 'neutral', hint: 'Not yet payable — the departure hasn’t happened.' },
  { state: 'pending', label: 'Pending release', tone: 'warning', hint: 'Departure happened; waiting for the Tuesday payout run.' },
  { state: 'released', label: 'Released', tone: 'success', hint: 'Paid out to your bank account.' },
];

export default function Payouts() {
  const { ledger } = useVendor();
  const { formatMoney } = useApp();

  const reversed = ledger.filter((l) => l.state === 'reversed');

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Payouts</h1>

      {BUCKETS.map((b) => {
        const rows = ledger.filter((l) => l.state === b.state);
        const total = rows.reduce((n, l) => n + l.net, 0);
        return (
          <Card key={b.state} className="flex flex-col gap-2 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusPill tone={b.tone}>{b.label}</StatusPill>
                <span className="text-xs text-fg-muted">{b.hint}</span>
              </div>
              <span className="font-mono text-sm font-semibold">{formatMoney(total)}</span>
            </div>
            {rows.length === 0 ? (
              <span className="text-xs text-fg-subtle">Nothing here.</span>
            ) : (
              <div className="flex flex-col">
                {rows.map((r) => (
                  <Link
                    key={r.id}
                    to="/vendor/payout"
                    state={{ id: r.id }}
                    className="flex items-center justify-between gap-2 border-t border-border py-2 text-sm no-underline first:border-0 first:pt-0 text-fg"
                  >
                    <span className="min-w-0 flex-1 truncate">{r.label}</span>
                    <span className="font-mono text-fg-muted">{formatMoney(r.net)}</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        );
      })}

      <Card className="flex flex-col gap-2 border-danger p-4 sm:p-5">
        <StatusPill tone="danger">Reversed</StatusPill>
        {reversed.length === 0 ? (
          <span className="text-xs text-fg-subtle">No reversals — good.</span>
        ) : (
          <div className="flex flex-col">
            {reversed.map((r) => (
              <Link
                key={r.id}
                to="/vendor/payout"
                state={{ id: r.id }}
                className="flex items-center justify-between gap-2 border-t border-border py-2 text-sm no-underline first:border-0 first:pt-0 text-fg"
              >
                <span className="min-w-0 flex-1 truncate">{r.label}</span>
                <span className="font-mono text-danger-text">− {formatMoney(r.net)}</span>
              </Link>
            ))}
          </div>
        )}
        <span className="text-xs leading-relaxed text-fg-subtle">
          A traveller cancellation after your payout already released shows here as a negative line, netted
          against your next payout rather than clawed back directly.
        </span>
      </Card>

      {ledger.length === 0 && <EmptyState title="No ledger activity yet" body="Confirmed bookings post here." />}
    </div>
  );
}
