import { useState } from 'react';
import { useApp } from '../../context/app/useApp';
import { useShop } from '../../context/shop/useShop';
import { DEMO_SELLER_ID } from '../../context/shop/shop-context';
import { PRODUCTS, SELLERS, stockKey, stockPill } from '../../data/shop/gear';
import { Card, Button, DataTable, StatusPill, KpiCard, Stepper } from '../../components/ui';

const RESTOCK_DEFAULT = 5;

// Flattens this seller's products into one row per variant — stock is a
// per-variant fact (§6 product: "a size sells out on its own"), so that's
// the natural row grain for a restock action too.
function variantRows() {
  const rows = [];
  PRODUCTS.filter((p) => p.sellerId === DEMO_SELLER_ID).forEach((p) => {
    p.variants.forEach((v) => rows.push({ id: `${p.id}:${v.id}`, productId: p.id, variantId: v.id, title: p.title, category: p.category, variantLabel: v.label, price: p.price }));
  });
  return rows;
}

export default function SellerProducts() {
  const { formatMoney } = useApp();
  const { stock, restockVariant } = useShop();
  const seller = SELLERS[DEMO_SELLER_ID];
  const rows = variantRows();
  const [qty, setQty] = useState(() => Object.fromEntries(rows.map((r) => [r.id, RESTOCK_DEFAULT])));

  const soldOutCount = rows.filter((r) => (stock[stockKey(r.productId, r.variantId)] ?? 0) <= 0).length;
  const unitsInStock = rows.reduce((n, r) => n + Math.max(0, stock[stockKey(r.productId, r.variantId)] ?? 0), 0);

  const columns = [
    { key: 'product', label: 'Product', render: (r) => (
      <div className="flex flex-col">
        <span className="font-semibold text-fg">{r.title}</span>
        <span className="text-xs text-fg-muted">{r.category} · {r.variantLabel}</span>
      </div>
    ) },
    { key: 'price', label: 'Price', render: (r) => <span className="font-mono">{formatMoney(r.price)}</span> },
    { key: 'stock', label: 'Stock', render: (r) => {
      const left = stock[stockKey(r.productId, r.variantId)] ?? 0;
      const pill = stockPill(left);
      return <StatusPill tone={pill.tone}>{pill.label} ({left})</StatusPill>;
    } },
  ];

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Your products</h1>
        <p className="text-sm text-fg-muted">{seller.name} · {seller.commissionPct}% commission on sales</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiCard value={rows.length} label="Product variants" />
        <KpiCard value={unitsInStock} label="Units in stock" tone={unitsInStock > 0 ? 'success' : 'warning'} />
        <KpiCard value={soldOutCount} label="Sold-out variants" tone={soldOutCount > 0 ? 'warning' : 'neutral'} />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        emptyTitle="No products yet"
        renderActions={(r) => (
          <div className="flex items-center gap-2">
            <Stepper value={qty[r.id]} onChange={(v) => setQty((q) => ({ ...q, [r.id]: v }))} min={1} max={100} srLabel="unit" />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => restockVariant(r.productId, r.variantId, qty[r.id])}
            >
              Restock +{qty[r.id]}
            </Button>
          </div>
        )}
      />

      <Card className="p-4 text-xs leading-relaxed text-fg-muted">
        Stock here is the same live count travellers see on Catalog and Product — restocking is instant, no review
        or admin approval needed. Listing new products isn't built yet in this pass.
      </Card>
    </div>
  );
}
