import { useApp } from '../../context/app/useApp';
import { useShop } from '../../context/shop/useShop';
import { FULFILMENT_STEPS, DEMO_SELLER_ID } from '../../context/shop/shop-context';
import { SELLERS } from '../../data/shop/gear';
import { Card, Button, StatusPill, Countdown, KpiCard, EmptyState } from '../../components/ui';

const STEP_LABEL = { packing: 'Packing', shipped: 'Shipped', delivered: 'Delivered' };

// Countdown expects a whole-second duration, not a fractional one — same
// floor-it-yourself gotcha the admin KYC queue's SLA badge hit (CLAUDE.md
// §8): always Math.floor before handing a diff to <Countdown>.
function shipSeconds(shipBy) {
  return Math.max(0, Math.floor((shipBy - Date.now()) / 1000));
}
function isLate(shipBy) {
  return Date.now() > shipBy;
}

export default function Fulfilment() {
  const { formatMoney } = useApp();
  const { orders, advanceFulfilment } = useShop();
  const seller = SELLERS[DEMO_SELLER_ID];

  // A seller only ever sees their own sub-orders from a shared order — never
  // another seller's parcel from the same purchase (§6, exact requirement).
  const myParcels = orders.flatMap((o) => o.subOrders
    .filter((s) => s.sellerId === DEMO_SELLER_ID)
    .map((s) => ({ order: o, subOrder: s })));

  const packing = myParcels.filter((p) => p.subOrder.state === 'packing' && !p.subOrder.returned);
  const lateParcels = packing.filter((p) => isLate(p.subOrder.shipBy));
  const inProgress = myParcels.filter((p) => p.subOrder.state !== 'delivered' && !p.subOrder.returned).length;

  if (!myParcels.length) {
    return <EmptyState title="No orders yet" body="Parcels for your products will show up here as soon as a traveller checks out." />;
  }

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Fulfilment</h1>
        <p className="text-sm text-fg-muted">{seller.name}'s own parcels — every buyer's other sellers are invisible here.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiCard value={myParcels.length} label="Total parcels" />
        <KpiCard value={inProgress} label="In progress" tone={inProgress > 0 ? 'warning' : 'neutral'} />
        <KpiCard value={lateParcels.length} label="Late dispatch" tone={lateParcels.length > 0 ? 'danger' : 'success'} />
      </div>

      {myParcels.map(({ order, subOrder: s }) => {
        const stepIndex = FULFILMENT_STEPS.indexOf(s.state);
        const late = s.state === 'packing' && isLate(s.shipBy);
        return (
          <Card key={s.id} className="flex flex-col gap-3 p-4 sm:p-5">
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex flex-col">
                <span dir="ltr" className="font-mono text-xs text-fg-muted">{order.ref} · {s.id}</span>
                <span className="text-xs text-fg-muted">{order.address?.name} · {order.address?.city}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {late && <StatusPill tone="danger">Late dispatch</StatusPill>}
                {s.returned ? <StatusPill tone="neutral">Returned</StatusPill> : <StatusPill tone={s.state === 'delivered' ? 'success' : 'info'}>{STEP_LABEL[s.state]}</StatusPill>}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {FULFILMENT_STEPS.map((step, i) => (
                <div key={step} className="flex flex-1 flex-col items-center gap-1">
                  <span className={`h-2.5 w-2.5 rounded-full ${i <= stepIndex ? 'bg-primary' : 'bg-sunken border border-border-strong'}`} />
                  <span className={`text-[10.5px] font-semibold uppercase tracking-wide ${i <= stepIndex ? 'text-fg' : 'text-fg-subtle'}`}>{STEP_LABEL[step]}</span>
                </div>
              ))}
            </div>

            {s.courier && (
              <div className="flex justify-between text-xs text-fg-muted">
                <span>Courier</span>
                <span dir="ltr" className="font-mono">{s.courier} · {s.trackingRef}</span>
              </div>
            )}

            {s.state === 'packing' && !s.returned && (
              <div className="flex items-center justify-between text-xs text-fg-muted">
                <span>Ship within</span>
                {late ? <span className="font-semibold text-danger-text">Deadline passed — dispatch now</span> : <Countdown key={s.id} seconds={shipSeconds(s.shipBy)} urgentAt={6 * 3600} />}
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 border-t border-border pt-2 text-[13px] text-fg-muted">
              {s.items.map((it, i) => <span key={i}>{it.title} · {it.variant} × {it.qty}</span>)}
            </div>

            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="font-mono text-sm font-semibold">{formatMoney(s.subtotal)}</span>
              {!s.returned && s.state !== 'delivered' && (
                <Button variant="secondary" size="sm" onClick={() => advanceFulfilment(order.ref, s.id)}>
                  Mark {STEP_LABEL[FULFILMENT_STEPS[stepIndex + 1]]}
                </Button>
              )}
              {s.returned && (
                <span className="text-xs text-fg-muted">Refunded {formatMoney(s.refund)} — reason: {s.returnReason}</span>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
