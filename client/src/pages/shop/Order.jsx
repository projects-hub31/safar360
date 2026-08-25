import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/app/useApp';
import { useShop } from '../../context/shop/useShop';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';
import EmptyState from '../../components/ui/EmptyState';

export default function Order() {
  const location = useLocation();
  const { formatMoney } = useApp();
  const { orders } = useShop();

  const refFromNav = location.state?.ref;
  const order = refFromNav ? orders.find((o) => o.ref === refFromNav) : orders[orders.length - 1];

  if (!order) {
    return (
      <EmptyState
        title="No order to show"
        body="Once a payment clears, its receipt and parcels land here."
        actionLabel="Browse gear"
        actionTo="/shop/catalog"
      />
    );
  }

  const mutations = [
    `Stock: ${order.subOrders.reduce((n, s) => n + s.items.length, 0)} line item(s) decremented`,
    `${order.subOrders.length} sub-order${order.subOrders.length === 1 ? '' : 's'} created, one per seller`,
    'Notification sent: order confirmation by SMS',
  ];

  return (
    <div className="mx-auto flex max-w-[560px] flex-col gap-4">
      <Card className="flex flex-col items-center gap-4 p-8 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-success-soft text-2xl text-success-text">✓</span>
        <span className="font-display text-2xl font-semibold tracking-tight">Order placed</span>
        <span dir="ltr" className="font-mono text-lg font-bold tracking-wide">{order.ref}</span>
        <p className="text-xs leading-relaxed text-fg-muted">
          One payment, split across {order.subOrders.length} independent parcel{order.subOrders.length === 1 ? '' : 's'} — a delay on
          one never holds up another. Retrying this page is safe; you are not charged again.
        </p>
      </Card>

      {order.subOrders.map((s) => (
        <Card key={s.id} className="flex flex-col gap-2 p-4 sm:p-5">
          <div className="flex items-baseline justify-between gap-2">
            <strong className="text-sm">{s.sellerName}</strong>
            <StatusPill tone="info">Packing</StatusPill>
          </div>
          {s.items.map((it, i) => (
            <div key={i} className="flex justify-between text-[13px] text-fg-muted">
              <span>{it.title} · {it.variant} × {it.qty}</span>
              <span className="font-mono">{formatMoney(it.lineTotal)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-border pt-1.5 text-[13px] font-semibold">
            <span>Sub-order total</span>
            <span className="font-mono">{formatMoney(s.subtotal)}</span>
          </div>
        </Card>
      ))}

      <Card className="flex flex-col gap-1.5 p-4 text-[13px] sm:p-5">
        <div className="flex justify-between text-fg-muted"><span>Subtotal</span><span className="font-mono">{formatMoney(order.subtotal)}</span></div>
        {order.discount > 0 && <div className="flex justify-between text-success-text"><span>Discount</span><span className="font-mono">− {formatMoney(order.discount)}</span></div>}
        <div className="flex justify-between text-fg-muted"><span>Shipping</span><span className="font-mono">{formatMoney(order.shipping)}</span></div>
        <div className="flex justify-between border-t-4 border-accent pt-2 text-[15px] font-bold"><span>Paid</span><span className="font-mono">{formatMoney(order.total)}</span></div>
      </Card>

      <Card className="flex flex-col gap-1.5 p-4 text-xs sm:p-5">
        <strong className="mb-1 text-[13px] text-fg">What changed in the system</strong>
        <div dir="ltr" className="flex flex-col gap-1 font-mono text-fg-muted">
          {mutations.map((m) => <span key={m}>· {m}</span>)}
        </div>
      </Card>

      <div className="flex gap-2">
        <Button to={`/shop/tracking/${order.ref}`} variant="secondary" fullWidth>Track parcels</Button>
        <Button to="/shop/catalog" fullWidth>Continue shopping</Button>
      </div>
    </div>
  );
}
