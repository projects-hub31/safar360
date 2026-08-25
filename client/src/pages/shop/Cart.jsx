import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/app/useApp';
import { useShop } from '../../context/shop/useShop';
import { SELLERS, stockKey } from '../../data/shop/gear';
import { SHIPPING_PER_SELLER } from '../../context/shop/shop-context';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import EmptyState from '../../components/ui/EmptyState';

export default function Cart() {
  const navigate = useNavigate();
  const { formatMoney } = useApp();
  const { stock, setQty, removeFromCart, applyCoupon, clearCoupon, coupon, cartLines, totalsFor } = useShop();
  const [promoInput, setPromoInput] = useState('');
  const [promoMsg, setPromoMsg] = useState(null);

  const lines = cartLines();
  const totals = totalsFor();

  if (!lines.length) {
    return (
      <EmptyState
        title="Your cart is empty"
        body="Nothing is held by adding an item — browse the catalog and bring something back here when you're ready."
        actionLabel="Browse gear"
        actionTo="/shop/catalog"
      />
    );
  }

  const bySeller = totals.sellerIds.map((sellerId) => ({
    seller: SELLERS[sellerId],
    lines: lines.filter((l) => l.product.sellerId === sellerId),
  }));

  const onApplyPromo = () => {
    if (!promoInput.trim()) return;
    const result = applyCoupon(promoInput);
    setPromoMsg(result);
  };

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Your cart</h1>

      {bySeller.map(({ seller, lines: sellerLines }) => {
        const subtotal = sellerLines.reduce((n, l) => n + l.lineTotal, 0);
        return (
          <Card key={seller.id} className="flex flex-col gap-3 p-4 sm:p-5">
            <div className="flex items-baseline justify-between gap-2">
              <strong className="text-sm">{seller.name}</strong>
              <span className="text-xs text-fg-muted">Ships separately · {formatMoney(SHIPPING_PER_SELLER)} shipping</span>
            </div>
            {sellerLines.map((l) => {
              const left = stock[stockKey(l.productId, l.variantId)] ?? 0;
              return (
                <div key={`${l.productId}:${l.variantId}`} className="flex items-center gap-3 border-t border-border pt-3 first:border-0 first:pt-0">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm font-bold">{l.product.title}</span>
                    <span className="text-xs text-fg-muted">{l.variant.label} · {formatMoney(l.product.price)} each</span>
                    {left < l.qty && <span className="text-xs font-semibold text-danger-text">Only {left} left — reduce quantity to check out.</span>}
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, left)}
                    value={l.qty}
                    onChange={(e) => setQty(l.productId, l.variantId, Math.max(1, Math.min(left || 1, +e.target.value || 1)))}
                    aria-label={`${l.product.title} quantity`}
                    className="h-10 w-16 rounded-lg border border-border-strong bg-raised text-center font-mono text-sm"
                  />
                  <span className="w-24 flex-none text-end font-mono text-sm font-semibold">{formatMoney(l.lineTotal)}</span>
                  <Button variant="tertiary" size="sm" onClick={() => removeFromCart(l.productId, l.variantId)}>Remove</Button>
                </div>
              );
            })}
            <div className="flex justify-between border-t border-border pt-2 text-[13px] text-fg-muted">
              <span>Seller subtotal</span>
              <span className="font-mono">{formatMoney(subtotal)}</span>
            </div>
          </Card>
        );
      })}

      <Card className="flex flex-col gap-2.5 p-4 sm:p-5">
        <strong className="text-sm">Promo code</strong>
        <div className="flex gap-2">
          <TextField className="flex-1" value={promoInput} onChange={(e) => setPromoInput(e.target.value)} placeholder="TREK10" />
          <Button variant="secondary" onClick={onApplyPromo}>Apply</Button>
        </div>
        {promoMsg && (
          <span className={`text-xs ${promoMsg.result === 'valid' ? 'text-success-text' : 'text-danger-text'}`}>{promoMsg.message || `${promoMsg.code} applied.`}</span>
        )}
        {coupon && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-success-text">{coupon.code} applied</span>
            <button type="button" onClick={() => { clearCoupon(); setPromoMsg(null); }} className="font-semibold text-fg-muted underline">Remove</button>
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-1.5 p-4 sm:p-5">
        <div className="flex justify-between text-[13px] text-fg-muted">
          <span>Subtotal</span>
          <span className="font-mono">{formatMoney(totals.subtotal)}</span>
        </div>
        {totals.discount > 0 && (
          <div className="flex justify-between text-[13px] text-success-text">
            <span>Promo discount</span>
            <span className="font-mono">− {formatMoney(totals.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-[13px] text-fg-muted">
          <span>Shipping · {totals.sellerIds.length} seller{totals.sellerIds.length === 1 ? '' : 's'}</span>
          <span className="font-mono">{formatMoney(totals.shipping)}</span>
        </div>
        <div className="mt-0.5 flex justify-between border-t-4 border-accent pt-2 text-[15px] font-bold">
          <span>Total</span>
          <span className="font-mono">{formatMoney(totals.total)}</span>
        </div>
      </Card>

      <Button size="lg" fullWidth onClick={() => navigate('/shop/checkout')}>
        Checkout — {formatMoney(totals.total)}
      </Button>
    </div>
  );
}
