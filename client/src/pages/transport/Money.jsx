import { useEffect } from 'react';
import { useApp } from '../../context/app/useApp';
import { useTransport } from '../../context/transport/useTransport';
import { useAdmin } from '../../context/admin/useAdmin';
import { Card, StatusPill, KpiCard, DataTable } from '../../components/ui';

// A transport quote has no dedicated commission rate the way a vendor plan
// or a gear seller does (§3 only tables those two) — it reads the platform
// default straight off live Policy, same "policy is read live, never a
// hard-coded threshold" rule the fraud/config screens follow. §3's lead
// lifecycle also has nothing past `accepted` (no departure/delivery event
// to key a payout release off), so — same honest-simplification spirit as
// the seller Money screen's two buckets — this is one flat list of what's
// been earned, not an invented multi-stage ledger.
export default function Money() {
  const { formatMoney } = useApp();
  const { leads, fetchLeadsInbox } = useTransport();
  const { policy } = useAdmin();

  useEffect(() => {
    fetchLeadsInbox();
    // Runs once on mount — fetchLeadsInbox is stable (useCallback, no deps).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const earned = leads
    .filter((l) => l.kind === 'transport' && l.status === 'accepted' && l.quote)
    .map((l) => {
      const gross = l.quote.total;
      const commission = Math.round(gross * (policy.commissionPct / 100));
      return { ...l, gross, commission, net: gross - commission };
    })
    .sort((a, b) => b.acceptedAt - a.acceptedAt);

  const totalNet = earned.reduce((n, l) => n + l.net, 0);

  const columns = [
    { key: 'trip', label: 'Trip', render: (l) => (
      <div className="flex flex-col">
        <span className="font-semibold text-fg">{l.subjectLabel}</span>
        <span className="text-xs text-fg-muted">{l.name} · {l.date} · {l.count} passengers</span>
      </div>
    ) },
    { key: 'gross', label: 'Gross', render: (l) => <span className="font-mono">{formatMoney(l.gross)}</span> },
    { key: 'commission', label: 'Commission', render: (l) => <span className="font-mono text-fg-muted">− {formatMoney(l.commission)}</span> },
    { key: 'net', label: 'Net', render: (l) => <span className="font-mono font-semibold">{formatMoney(l.net)}</span> },
    { key: 'status', label: 'Status', render: () => <StatusPill tone="success">Accepted</StatusPill> },
  ];

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Money</h1>
        <p className="text-sm text-fg-muted">Earnings from accepted quotes · {policy.commissionPct}% platform commission (default rate)</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiCard value={formatMoney(totalNet)} label="Lifetime net earnings" tone="success" />
        <KpiCard value={earned.length} label="Accepted quotes" />
      </div>

      <DataTable
        columns={columns}
        rows={earned}
        rowKey={(l) => l.id}
        emptyTitle="No earnings yet"
        emptyBody="A quote you send starts earning once the traveller accepts it — see Quotes for what's still awaiting a reply."
      />

      <Card className="p-4 text-xs leading-relaxed text-fg-muted">
        Commission reads the platform's live default rate from admin Config — every figure above recalculates
        immediately if that rate changes, the same way the fraud and weather-refund gates do.
      </Card>
    </div>
  );
}
