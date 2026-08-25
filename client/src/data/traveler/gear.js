import gearJacket from '../../assets/traveler/gear-jacket.jpg';

// Per-seller commission rate lives on the seller, not a shared global (§3
// "Gear sellers likewise carry a per-seller commission rate, not a shared
// default" — the exact three seed sellers named in CLAUDE.md §3).
// `codAllowed` backs the COD-blocking rule (§3): COD is refused when the
// order total exceeds COD_CAP AND at least one seller in the cart doesn't
// support it — Indus Trek Supply is the one seller here that doesn't.
export const SELLERS = {
  'karakoram-gear': { id: 'karakoram-gear', name: 'Karakoram Gear', commissionPct: 12, codAllowed: true, rating: 4.7 },
  'baltistan-outfitters': { id: 'baltistan-outfitters', name: 'Baltistan Outfitters', commissionPct: 10, codAllowed: true, rating: 4.6 },
  'indus-trek-supply': { id: 'indus-trek-supply', name: 'Indus Trek Supply', commissionPct: 14, codAllowed: false, rating: 4.5 },
};

export const CATEGORIES = ['Jackets', 'Footwear', 'Camping', 'Backpacks', 'Accessories'];

// One product only carries a real photo — the rest deliberately have none,
// so Catalog/Product/Cart all have to prove a card never requires an image
// to function (§2 "vendor uploads assumed bad — layout must never collapse
// on a broken image"). `variants[].stock` is the seed for ShopContext's
// mutable, canonical stock map — a size can sell out on its own without the
// rest of the product going with it (§6 product: "gone: true per variant").
export const PRODUCTS = [
  {
    id: 'down-jacket', sellerId: 'karakoram-gear', category: 'Jackets',
    title: '700-Fill Down Jacket', price: 18500, rating: 4.8, reviews: 62,
    img: gearJacket, alt: 'Red down jacket laid flat on rock',
    variants: [
      { id: 's', label: 'S', stock: 6 },
      { id: 'm', label: 'M', stock: 9 },
      { id: 'l', label: 'L', stock: 0 },
      { id: 'xl', label: 'XL', stock: 4 },
    ],
  },
  {
    id: 'trek-boots', sellerId: 'baltistan-outfitters', category: 'Footwear',
    title: 'Waterproof Trekking Boots', price: 12900, rating: 4.6, reviews: 118,
    img: null, alt: '',
    variants: [
      { id: '40', label: 'EU 40', stock: 5 },
      { id: '41', label: 'EU 41', stock: 7 },
      { id: '42', label: 'EU 42', stock: 0 },
      { id: '43', label: 'EU 43', stock: 3 },
      { id: '44', label: 'EU 44', stock: 2 },
    ],
  },
  {
    id: 'four-season-tent', sellerId: 'indus-trek-supply', category: 'Camping',
    title: '4-Season Dome Tent', price: 32000, rating: 4.9, reviews: 41,
    img: null, alt: '',
    variants: [
      { id: '2p', label: '2-person', stock: 4 },
      { id: '4p', label: '4-person', stock: 2 },
    ],
  },
  {
    id: 'trekking-poles', sellerId: 'karakoram-gear', category: 'Accessories',
    title: 'Carbon Trekking Poles (pair)', price: 4200, rating: 4.5, reviews: 96,
    img: null, alt: '',
    variants: [{ id: 'pair', label: 'Pair', stock: 14 }],
  },
  {
    id: 'daypack-30l', sellerId: 'baltistan-outfitters', category: 'Backpacks',
    title: '30L Daypack', price: 8600, rating: 4.4, reviews: 73,
    img: null, alt: '',
    variants: [
      { id: '30l', label: '30 L', stock: 8 },
      { id: '45l', label: '45 L', stock: 5 },
    ],
  },
  {
    id: 'sleeping-bag', sellerId: 'indus-trek-supply', category: 'Camping',
    title: '-15°C Sleeping Bag', price: 15800, rating: 4.7, reviews: 54,
    img: null, alt: '',
    variants: [
      { id: 'regular', label: 'Regular', stock: 6 },
      { id: 'long', label: 'Long', stock: 0 },
    ],
  },
  {
    id: 'merino-base-layer', sellerId: 'karakoram-gear', category: 'Jackets',
    title: 'Merino Wool Base Layer', price: 5400, rating: 4.6, reviews: 87,
    img: null, alt: '',
    variants: [
      { id: 's', label: 'S', stock: 10 },
      { id: 'm', label: 'M', stock: 12 },
      { id: 'l', label: 'L', stock: 9 },
      { id: 'xl', label: 'XL', stock: 6 },
    ],
  },
  {
    id: 'gaiters', sellerId: 'baltistan-outfitters', category: 'Accessories',
    title: 'Snow Gaiters', price: 3200, rating: 4.3, reviews: 29,
    img: null, alt: '',
    variants: [{ id: 'onesize', label: 'One size', stock: 20 }],
  },
];

export function stockKey(productId, variantId) {
  return `${productId}:${variantId}`;
}

// Seed for ShopContext's mutable stock map — read once at boot, exactly like
// tours.js's AVAILABILITY export for BookingContext (§3: the server is the
// truth, so this static object is never read directly by a screen once
// ShopContext owns the live copy).
export const STOCK = PRODUCTS.reduce((map, p) => {
  p.variants.forEach((v) => { map[stockKey(p.id, v.id)] = v.stock; });
  return map;
}, {});

export function stockPill(n) {
  if (n <= 0) return { label: 'Sold out', tone: 'neutral' };
  if (n <= 3) return { label: `${n} left`, tone: 'danger' };
  return { label: 'In stock', tone: 'success' };
}
