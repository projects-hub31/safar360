import { useApp } from '../../context/app/useApp';
import { useShop } from '../../context/shop/useShop';
import { DEMO_SELLER_ID } from '../../context/shop/shop-context';
import { SELLERS } from '../../data/shop/gear';
import { DataTable, StatusPill, KpiCard, EmptyState } from '../../components/ui';

const REASON_LABEL = { size: 'Wrong size', damaged: 'Arrived damaged', wrong: 'Not as listed', changed: 'Changed mind' };

export default function SellerReturns() {
  const { formatMoney } = useApp();
  const { orders } = useShop();
  const seller = SELLERS[DEMO_SELLER_ID];

  // Same "own sub-orders only" boundary as Fulfilment — a seller reads their
  // own returns off the same shared `orders` array, never another seller's.
  const returns = orders.flatMap((o) => o.subOrders
    .filter((s) => s.sellerId === DEMO_SELLER_ID && s.returned)
    .map((s) => ({ id: s.id, orderRef: o.ref, ...s })));

  const sellerFaultCount = returns.filter((r) => r.returnFee === 0).length;
  const totalRefunded = returns.reduce((n, r) => n + (r.refund || 0), 0);

  if (!returns.length) {
    return <EmptyState title="No returns yet" body="Returned parcels for your products will show up here, restocked automatically." />;
  }

  const columns = [
    { key: 'order', label: 'Order', render: (r) => <span dir="ltr" className="font-mono text-xs">{r.orderRef}</span> },
    { key: 'items', label: 'Items', render: (r) => (
      <span className="text-xs text-fg-muted">{r.items.map((it) => `${it.title} · ${it.variant}`).join(', ')}</span>
    ) },
    { key: 'reason', label: 'Reason', render: (r) => (
      <StatusPill tone={r.returnFee === 0 ? 'danger' : 'neutral'}>{REASON_LABEL[r.returnReason] || r.returnReason}</StatusPill>
    ) },
    { key: 'refund', label: 'Refunded', render: (r) => <span className="font-mono">{formatMoney(r.refund)}</span> },
    { key: 'fault', label: 'Return shipping', render: (r) => (r.returnFee === 0 ? 'Free — seller fault' : `Rs ${r.returnFee} charged to buyer`) },
  ];

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Returns</h1>
        <p className="text-sm text-fg-muted">{seller.name}'s own returned parcels — stock was restored automatically on each one.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiCard value={returns.length} label="Total returns" />
        <KpiCard value={sellerFaultCount} label="Seller-fault returns" tone={sellerFaultCount > 0 ? 'warning' : 'neutral'} />
        <KpiCard value={formatMoney(totalRefunded)} label="Total refunded" />
      </div>

      <DataTable columns={columns} rows={returns} rowKey={(r) => r.id} />
    </div>
  );
}
