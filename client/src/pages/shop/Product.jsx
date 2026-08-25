import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/useApp';
import { useShop } from '../../context/useShop';
import { PRODUCTS, SELLERS, stockKey } from '../../data/traveler/gear';
import Button from '../../components/ui/Button';
import Stepper from '../../components/ui/Stepper';
import StatusPill from '../../components/ui/StatusPill';
import ChoiceCard from '../../components/ui/ChoiceCard';
import EmptyState from '../../components/ui/EmptyState';

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formatMoney } = useApp();
  const { stock, addToCart } = useShop();
  const product = PRODUCTS.find((p) => p.id === id);

  const [variantId, setVariantId] = useState(() => product?.variants.find((v) => (stock[stockKey(product.id, v.id)] ?? 0) > 0)?.id || product?.variants[0]?.id);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) {
    return <EmptyState title="Item not found" body="This product may have been removed by its seller." actionLabel="Back to catalog" actionTo="/shop/catalog" />;
  }

  const seller = SELLERS[product.sellerId];
  const variant = product.variants.find((v) => v.id === variantId) || product.variants[0];
  const variantStock = stock[stockKey(product.id, variant.id)] ?? 0;
  const soldOut = variantStock <= 0;

  const onAdd = () => {
    if (soldOut) return;
    addToCart(product.id, variant.id, qty);
    setAdded(true);
  };

  return (
    <div className="mx-auto grid max-w-[900px] items-start gap-5 lg:grid-cols-2">
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-sunken">
        {product.img ? (
          <img src={product.img} alt={product.alt} className="h-full w-full rounded-2xl object-cover" />
        ) : (
          <span className="font-display text-lg font-semibold text-fg-subtle">{product.title}</span>
        )}
      </div>

      <div className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-[30px]">{product.title}</h1>
          <div className="flex items-center gap-2.5 text-[13px] text-fg-muted">
            <span className="font-mono font-semibold text-fg">★ {product.rating.toFixed(1)}</span>
            <span>{product.reviews} reviews</span>
          </div>
          <StatusPill tone="success" icon="✓" className="w-fit">{seller.name}</StatusPill>
        </div>

        <div className="font-mono text-2xl font-semibold">{formatMoney(product.price)}</div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-bold">Size / variant</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {product.variants.map((v) => {
              const left = stock[stockKey(product.id, v.id)] ?? 0;
              const gone = left <= 0;
              return (
                <ChoiceCard
                  key={v.id}
                  active={variantId === v.id}
                  disabled={gone}
                  onClick={() => { setVariantId(v.id); setAdded(false); }}
                  title={v.label}
                  subtitle={gone ? 'Sold out' : left <= 3 ? `${left} left` : undefined}
                />
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-bold">Quantity</span>
          <Stepper value={qty} onChange={setQty} min={1} max={Math.max(1, variantStock)} srLabel="item" />
        </div>

        {added ? (
          <div className="flex flex-col gap-2 rounded-xl border border-success bg-success-soft p-3.5">
            <span className="text-sm font-semibold text-success-text">Added to your cart.</span>
            <div className="flex gap-2">
              <Button to="/shop/cart" fullWidth>Go to cart</Button>
              <Button variant="secondary" fullWidth onClick={() => setAdded(false)}>Keep browsing</Button>
            </div>
          </div>
        ) : (
          <Button onClick={onAdd} disabled={soldOut} size="lg" fullWidth>
            {soldOut ? 'Sold out in this size' : `Add to cart — ${formatMoney(product.price * qty)}`}
          </Button>
        )}
        <p className="text-xs leading-relaxed text-fg-muted">
          Adding to a cart holds nothing. Stock comes down only when payment is verified — which is why two people
          can reach checkout for the last one.
        </p>
        <Button variant="tertiary" size="sm" className="w-fit" onClick={() => navigate('/shop/catalog')}>← Back to catalog</Button>
      </div>
    </div>
  );
}
