import { Link } from 'react-router-dom';
import { useApp } from '../../context/useApp';
import { useShop } from '../../context/useShop';
import { SELLERS, stockKey, stockPill } from '../../data/traveler/gear';
import StatusPill from '../ui/StatusPill';

// Same shell as traveler/TourCard — image·title·meta·price·action — but every
// gear product except one has no photo, deliberately, so this card has to
// prove it works without one (§2 "no card ever requires an image to function").
export default function ProductCard({ product }) {
  const { formatMoney } = useApp();
  const { stock } = useShop();
  const seller = SELLERS[product.sellerId];
  const totalStock = product.variants.reduce((n, v) => n + (stock[stockKey(product.id, v.id)] ?? 0), 0);
  const pill = stockPill(totalStock);

  return (
    <Link
      to={`/shop/product/${product.id}`}
      className="flex flex-col overflow-hidden rounded-card border border-border bg-surface text-fg no-underline shadow-sh1"
    >
      <div className="flex aspect-square items-center justify-center bg-sunken">
        {product.img ? (
          <img src={product.img} alt={product.alt} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="font-display text-sm font-semibold text-fg-subtle">{product.title}</span>
        )}
      </div>
      <div className="flex flex-col gap-1.5 p-3">
        <div className="flex items-baseline gap-2">
          <span className="flex-1 text-[14.5px] font-bold leading-tight">{product.title}</span>
          <span className="flex-none font-mono text-xs font-semibold">★ {product.rating.toFixed(1)}</span>
        </div>
        <StatusPill tone="success" icon="✓" className="w-fit">{seller.name}</StatusPill>
        <div className="mt-0.5 flex items-baseline justify-between gap-2 border-t border-border pt-2">
          <span className="font-mono text-base font-semibold">{formatMoney(product.price)}</span>
          <StatusPill tone={pill.tone}>{pill.label}</StatusPill>
        </div>
      </div>
    </Link>
  );
}
