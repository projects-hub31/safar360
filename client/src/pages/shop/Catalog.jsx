import { useMemo, useState } from 'react';
import { useShop } from '../../context/shop/useShop';
import { PRODUCTS, SELLERS, CATEGORIES, stockKey } from '../../data/shop/gear';
import ProductCard from '../../components/shop/ProductCard';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';

export default function Catalog() {
  const { stock } = useShop();
  const [categories, setCategories] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [inStockOnly, setInStockOnly] = useState(false);

  const categoryCounts = useMemo(() => {
    const c = {};
    PRODUCTS.forEach((p) => { c[p.category] = (c[p.category] || 0) + 1; });
    return c;
  }, []);
  const sellerCounts = useMemo(() => {
    const c = {};
    PRODUCTS.forEach((p) => { c[p.sellerId] = (c[p.sellerId] || 0) + 1; });
    return c;
  }, []);

  const toggle = (setter) => (id) => setter((list) => (list.includes(id) ? list.filter((x) => x !== id) : list.concat(id)));
  const toggleCategory = toggle(setCategories);
  const toggleSeller = toggle(setSellers);
  const clearFilters = () => { setCategories([]); setSellers([]); setInStockOnly(false); };

  const inStock = (p) => p.variants.some((v) => (stock[stockKey(p.id, v.id)] ?? 0) > 0);

  const results = PRODUCTS
    .filter((p) => !categories.length || categories.includes(p.category))
    .filter((p) => !sellers.length || sellers.includes(p.sellerId))
    .filter((p) => !inStockOnly || inStock(p));

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside aria-label="Filters" className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-baseline justify-between gap-2.5">
          <strong className="text-sm">Filters</strong>
          <Button variant="tertiary" size="sm" onClick={clearFilters} className="min-h-8 px-1">Clear all</Button>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[12.5px] font-bold">Category</span>
          {CATEGORIES.map((c) => (
            <label key={c} className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm">
              <input type="checkbox" checked={categories.includes(c)} onChange={() => toggleCategory(c)} className="h-[17px] w-[17px] accent-jade-600" />
              <span className="flex-1">{c}</span>
              <span className="font-mono text-[11.5px] text-fg-subtle">{categoryCounts[c] || 0}</span>
            </label>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-3.5">
          <span className="text-[12.5px] font-bold">Seller</span>
          {Object.values(SELLERS).map((s) => (
            <label key={s.id} className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm">
              <input type="checkbox" checked={sellers.includes(s.id)} onChange={() => toggleSeller(s.id)} className="h-[17px] w-[17px] accent-jade-600" />
              <span className="flex-1">{s.name}</span>
              <span className="font-mono text-[11.5px] text-fg-subtle">{sellerCounts[s.id] || 0}</span>
            </label>
          ))}
        </div>

        <label className="flex min-h-9 cursor-pointer items-center gap-2.5 border-t border-border pt-3.5 text-sm">
          <input type="checkbox" checked={inStockOnly} onChange={() => setInStockOnly((v) => !v)} className="h-[17px] w-[17px] accent-jade-600" />
          <span>In stock only</span>
        </label>
      </aside>

      <div className="flex min-w-0 flex-col gap-3.5">
        <div className="text-[15px] font-bold">{results.length} item{results.length === 1 ? '' : 's'}</div>
        {results.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <EmptyState
            title="No gear matches those filters"
            body={`Widen the category or seller filter — there are ${PRODUCTS.length} items in the catalog.`}
            actionLabel="Clear filters"
            onAction={clearFilters}
          />
        )}
      </div>
    </div>
  );
}
