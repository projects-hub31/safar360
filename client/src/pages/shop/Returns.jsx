import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/app/useApp';
import { useShop } from '../../context/shop/useShop';
import { RETURN_REASONS, RETURN_SHIPPING_FEE } from '../../context/shop/shop-context';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ChoiceCard from '../../components/ui/ChoiceCard';
import EmptyState from '../../components/ui/EmptyState';

export default function Returns() {
  const { ref, subOrderId } = useParams();
  const navigate = useNavigate();
  const { formatMoney } = useApp();
  const { orders, submitReturn } = useShop();

  const order = orders.find((o) => o.ref === ref);
  const subOrder = order?.subOrders.find((s) => s.id === subOrderId);
  const [reasonId, setReasonId] = useState(null);
  const [done, setDone] = useState(null);

  if (!subOrder) {
    return <EmptyState title="Nothing to return" body="This parcel wasn't found, or has already been returned." actionLabel="View orders" actionTo="/shop/catalog" />;
  }
  if (subOrder.state !== 'delivered' && !done) {
    return <EmptyState title="Not eligible yet" body="A parcel can only be returned once it has been marked delivered." actionLabel="Back to tracking" actionTo={`/shop/tracking/${ref}`} />;
  }
  if (subOrder.returned && !done) {
    return <EmptyState title="Already returned" body={`This parcel was already returned — Rs ${subOrder.refund.toLocaleString('en-US')} was refunded.`} actionLabel="Back to tracking" actionTo={`/shop/tracking/${ref}`} />;
  }

  const reason = RETURN_REASONS.find((r) => r.id === reasonId);
  const fee = reason ? (reason.sellerFault ? 0 : RETURN_SHIPPING_FEE) : null;

  const onSubmit = () => {
    if (!reasonId) return;
    const result = submitReturn(ref, subOrderId, reasonId);
    setDone(result);
  };

  if (done) {
    return (
      <Card className="mx-auto flex max-w-[480px] flex-col items-start gap-3 p-6">
        <span className="font-display text-xl font-semibold">Return started</span>
        <p className="text-sm leading-relaxed text-fg-muted">
          {done.reason.sellerFault
            ? 'This was the seller\'s fault, so return shipping is free.'
            : `A return shipping fee of ${formatMoney(RETURN_SHIPPING_FEE)} was deducted from your refund.`}
          {' '}You'll get {formatMoney(done.refund)} back, and stock has already been restored.
        </p>
        <Button to="/shop/catalog" fullWidth>Done</Button>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex max-w-[480px] flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Return this parcel</h1>
      <Card className="flex flex-col gap-1.5 p-4 text-[13px] text-fg-muted">
        <strong className="text-sm text-fg">{subOrder.sellerName}</strong>
        {subOrder.items.map((it, i) => <span key={i}>{it.title} · {it.variant} × {it.qty}</span>)}
      </Card>

      <div className="flex flex-col gap-2">
        <span className="text-[12.5px] font-bold">Why are you returning this?</span>
        {RETURN_REASONS.map((r) => (
          <ChoiceCard key={r.id} active={reasonId === r.id} onClick={() => setReasonId(r.id)} title={r.label} subtitle={r.sellerFault ? 'Free return shipping — this is the seller\'s fault' : `Rs ${RETURN_SHIPPING_FEE} return shipping, deducted from your refund`} />
        ))}
      </div>

      {reason && (
        <Card className="flex justify-between p-4 text-sm font-semibold">
          <span>Refund estimate</span>
          <span className="font-mono">{formatMoney(subOrder.subtotal - (fee || 0))}</span>
        </Card>
      )}

      <div className="flex gap-2">
        <Button variant="secondary" fullWidth onClick={() => navigate(`/shop/tracking/${ref}`)}>Cancel</Button>
        <Button fullWidth disabled={!reasonId} onClick={onSubmit}>Submit return</Button>
      </div>
    </div>
  );
}
