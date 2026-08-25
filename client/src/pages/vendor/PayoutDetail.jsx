import { useLocation } from 'react-router-dom';
import { useVendor } from '../../context/vendor/useVendor';
import { useApp } from '../../context/app/useApp';
import Card from '../../components/ui/Card';
import StatusPill from '../../components/ui/StatusPill';
import EmptyState from '../../components/ui/EmptyState';

const TONE = { released: 'success', pending: 'warning', accruing: 'neutral', reversed: 'danger' };

export default function PayoutDetail() {
  const location = useLocation();
  const { ledger } = useVendor();
  const { formatMoney } = useApp();

  const row = ledger.find((l) => l.id === location.state?.id);

  if (!row) {
    return (
      <EmptyState title="Payout not found" body="Open this from the payouts list." actionLabel="Back to payouts" actionTo="/vendor/payouts" />
    );
  }

  const isReversal = row.state === 'reversed';

  return (
    <div className="mx-auto flex max-w-[520px] flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{row.id}</h1>
        <StatusPill tone={TONE[row.state]}>{row.state}</StatusPill>
      </div>

      <Card className="flex flex-col gap-2.5 p-4 sm:p-5">
        <div className="flex justify-between text-sm"><span className="text-fg-muted">Booking</span><span className="font-mono">{row.ref}</span></div>
        <div className="flex justify-between text-sm"><span className="text-fg-muted">{row.label}</span></div>
        <div className="border-t border-border pt-2.5" />
        <div className="flex justify-between text-sm"><span className="text-fg-muted">Gross</span><span className="font-mono">{formatMoney(row.gross)}</span></div>
        <div className="flex justify-between text-sm">
          <span className="text-fg-muted">Commission ({Math.round(row.rate * 100)}%)</span>
          <span className="font-mono text-danger-text">− {formatMoney(row.commission)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2.5 text-sm font-semibold">
          <span>{isReversal ? 'Reversed (netted against next payout)' : 'Net to you'}</span>
          <span className={`font-mono ${isReversal ? 'text-danger-text' : 'text-success-text'}`}>
            {isReversal ? '− ' : ''}{formatMoney(row.net)}
          </span>
        </div>
      </Card>

      {isReversal && (
        <p className="text-xs leading-relaxed text-fg-subtle">
          This booking was cancelled after your share had already been marked released. Rather than pulling money
          back out of your bank account, it's subtracted from your next payout batch.
        </p>
      )}
    </div>
  );
}
