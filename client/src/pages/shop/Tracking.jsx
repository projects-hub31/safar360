import { useParams } from 'react-router-dom';
import { useApp } from '../../context/useApp';
import { useShop } from '../../context/useShop';
import { FULFILMENT_STEPS } from '../../context/shop-context';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';
import EmptyState from '../../components/ui/EmptyState';

const STEP_LABEL = { packing: 'Packing', shipped: 'Shipped', delivered: 'Delivered' };

export default function Tracking() {
  const { ref } = useParams();
  const { formatMoney } = useApp();
  const { orders, advanceFulfilment } = useShop();

  const order = ref ? orders.find((o) => o.ref === ref) : orders[orders.length - 1];

  if (!order) {
    return (
      <EmptyState
        title="Nothing to track yet"
        body="Once you place an order, each seller's parcel gets its own independent tracker here."
        actionLabel="Browse gear"
        actionTo="/shop/catalog"
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Tracking</h1>
        <span dir="ltr" className="font-mono text-xs text-fg-muted">{order.ref}</span>
      </div>

      {order.subOrders.map((s) => {
        const stepIndex = FULFILMENT_STEPS.indexOf(s.state);
        return (
          <Card key={s.id} className="flex flex-col gap-3 p-4 sm:p-5">
            <div className="flex items-baseline justify-between gap-2">
              <strong className="text-sm">{s.sellerName}</strong>
              {s.returned ? <StatusPill tone="neutral">Returned</StatusPill> : <StatusPill tone={s.state === 'delivered' ? 'success' : 'info'}>{STEP_LABEL[s.state]}</StatusPill>}
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
            {s.state === 'packing' && (
              <p className="text-xs text-fg-muted">Ships within 2 days of order — this seller only ever sees their own parcel from this order, never anyone else's.</p>
            )}

            <div className="flex flex-wrap gap-1.5 border-t border-border pt-2 text-[13px] text-fg-muted">
              {s.items.map((it, i) => <span key={i}>{it.title} · {it.variant} × {it.qty}</span>)}
            </div>

            <div className="flex gap-2">
              {!s.returned && s.state !== 'delivered' && (
                <Button variant="secondary" size="sm" onClick={() => advanceFulfilment(order.ref, s.id)}>
                  Demo: advance to {STEP_LABEL[FULFILMENT_STEPS[stepIndex + 1]]}
                </Button>
              )}
              {!s.returned && s.state === 'delivered' && (
                <Button variant="secondary" size="sm" to={`/shop/returns/${order.ref}/${s.id}`}>Return this parcel</Button>
              )}
              {s.returned && (
                <span className="text-xs text-fg-muted">Refunded {formatMoney(s.refund)} for reason: {s.returnReason}.</span>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
