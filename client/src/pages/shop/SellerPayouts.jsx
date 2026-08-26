import { useApp } from '../../context/app/useApp';
import { useShop } from '../../context/shop/useShop';
import { DEMO_SELLER_ID } from '../../context/shop/shop-context';
import { SELLERS } from '../../data/shop/gear';
import { Card, StatusPill, KpiCard, EmptyState } from '../../components/ui';

// A sub-order's commission accrues on delivery, not on packing/shipped —
// §3's ledger model ("accruing -> accrued -> pending -> released") doesn't
// have a per-seller payout-batch mechanic built for gear yet (only the
// tour-operator ledger does, see vendor/Payouts.jsx), so this stays a
// two-bucket honest simplification rather than inventing a release step
// nothing else in ShopContext drives. A returned parcel earns nothing —
// §3: "Returning ... reverses the commission accrual" — computed here at
// display time since ShopContext.submitReturn doesn't persist a reversed
// commission field on the sub-order itself.
const BUCKETS = [
  { key: 'accruing', label: 'Accruing', tone: 'neutral', hint: 'Not yet delivered — commission isn’t earned until the parcel arrives.' },
  { key: 'payable', label: 'Payable', tone: 'success', hint: 'Delivered and kept — yours to be paid out.' },
];

export default function SellerPayouts() {
  const { formatMoney } = useApp();
  const { orders } = useShop();
  const seller = SELLERS[DEMO_SELLER_ID];

  const myParcels = orders.flatMap((o) => o.subOrders
    .filter((s) => s.sellerId === DEMO_SELLER_ID)
    .map((s) => ({ order: o, subOrder: s })));

  const returned = myParcels.filter((p) => p.subOrder.returned);
  const bucketed = (key) => myParcels.filter(({ subOrder: s }) => {
    if (s.returned) return false;
    return key === 'payable' ? s.state === 'delivered' : s.state !== 'delivered';
  });

  const lifetimeNet = myParcels.reduce((n, { subOrder: s }) => (s.returned ? n : n + (s.subtotal - s.commission)), 0);

  if (!myParcels.length) {
    return <EmptyState title="No earnings yet" body="Commission on your delivered parcels will show up here as soon as a traveller checks out." />;
  }

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Money</h1>
        <p className="text-sm text-fg-muted">{seller.name} · {seller.commissionPct}% platform commission on delivered sales</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiCard value={formatMoney(lifetimeNet)} label="Lifetime net earnings" tone="success" />
        <KpiCard value={myParcels.length} label="Total parcels" />
        <KpiCard value={returned.length} label="Returned" tone={returned.length > 0 ? 'warning' : 'neutral'} />
      </div>

      {BUCKETS.map((b) => {
        const rows = bucketed(b.key);
        const total = rows.reduce((n, { subOrder: s }) => n + (s.subtotal - s.commission), 0);
        return (
          <Card key={b.key} className="flex flex-col gap-2 p-4 sm:p-5">
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
                {rows.map(({ order, subOrder: s }) => (
                  <div key={s.id} className="flex items-center justify-between gap-2 border-t border-border py-2 text-sm first:border-0 first:pt-0">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span dir="ltr" className="min-w-0 truncate font-mono text-xs text-fg-muted">{order.ref}</span>
                      <span className="text-fg-subtle text-xs">Gross {formatMoney(s.subtotal)} − commission {formatMoney(s.commission)}</span>
                    </div>
                    <span className="font-mono text-fg-muted">{formatMoney(s.subtotal - s.commission)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}

      <Card className="flex flex-col gap-2 border-danger p-4 sm:p-5">
        <StatusPill tone="danger">Returned — no commission</StatusPill>
        {returned.length === 0 ? (
          <span className="text-xs text-fg-subtle">No returns — good.</span>
        ) : (
          <div className="flex flex-col">
            {returned.map(({ order, subOrder: s }) => (
              <div key={s.id} className="flex items-center justify-between gap-2 border-t border-border py-2 text-sm first:border-0 first:pt-0">
                <span dir="ltr" className="min-w-0 flex-1 truncate font-mono text-xs text-fg-muted">{order.ref}</span>
                <span className="font-mono text-danger-text">Rs 0</span>
              </div>
            ))}
          </div>
        )}
        <span className="text-xs leading-relaxed text-fg-subtle">
          A returned parcel refunds the buyer and reverses your commission accrual entirely — it never nets
          against another sub-order.
        </span>
      </Card>
    </div>
  );
}
