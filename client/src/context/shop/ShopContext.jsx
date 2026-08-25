import { useRef, useState } from 'react';
import { ShopContext } from './shop-context';
import {
  SHIPPING_PER_SELLER, COD_CAP, CHECKOUT_SESSION_MINUTES, SHIP_WITHIN_DAYS,
  DECLINE_CARD, FRAUD_CARD, FRAUD_AMOUNT_THRESHOLD, refFor,
  COUPONS, EXPIRED_COUPON, USED_COUPON, USED_COUPON_ORDER_REF,
  RETURN_REASONS, RETURN_SHIPPING_FEE, FULFILMENT_STEPS,
} from './shop-context';
import { PRODUCTS, SELLERS, STOCK, stockKey } from '../../data/shop/gear';

const FAIL_REASONS = {
  failed: 'Your card was declined by the issuing bank. Nothing was charged.',
  held: 'Score above the review threshold — a human checks this within the hour.',
  'sold-out': 'Stock for at least one item ran out moments before your payment cleared. Refunded automatically for the affected line — the rest of your order is unaffected.',
};

// §6/§3: "Adding to a cart holds nothing. Stock comes down when payment is
// verified, not when you add." So — unlike BookingContext's seat lock — there
// is no reservation object here at all, only a plain cart array and a
// cosmetic checkout-session countdown (never a real hold).
export function ShopProvider({ children }) {
  const [cart, setCart] = useState([]); // [{ productId, variantId, qty }]
  const [stock, setStock] = useState(() => ({ ...STOCK })); // canonical, mutable — §3 atomic-check pattern
  const [coupon, setCoupon] = useState(null);
  const [session, setSession] = useState(null); // { startedAt, expiresAt } — cosmetic only
  const [paymentState, setPaymentState] = useState('idle');
  const [orders, setOrders] = useState([]);
  const [notifyList, setNotifyList] = useState([]); // productId:variantId a traveller asked to be notified about

  const nextId = useRef(1);
  const genId = (prefix) => `${prefix}${nextId.current++}`;

  // --- cart ----------------------------------------------------------------
  const addToCart = (productId, variantId, qty = 1) => {
    setCart((c) => {
      const i = c.findIndex((l) => l.productId === productId && l.variantId === variantId);
      if (i === -1) return c.concat({ productId, variantId, qty });
      return c.map((l, idx) => (idx === i ? { ...l, qty: l.qty + qty } : l));
    });
  };
  const setQty = (productId, variantId, qty) => {
    setCart((c) => (qty <= 0
      ? c.filter((l) => !(l.productId === productId && l.variantId === variantId))
      : c.map((l) => (l.productId === productId && l.variantId === variantId ? { ...l, qty } : l))));
  };
  const removeFromCart = (productId, variantId) => setQty(productId, variantId, 0);
  const clearCart = () => { setCart([]); setCoupon(null); };

  // --- derived read helpers (pure — safe to call from render) --------------
  const cartLines = (cartArr = cart) => cartArr
    .map((item) => {
      const product = PRODUCTS.find((p) => p.id === item.productId);
      const variant = product?.variants.find((v) => v.id === item.variantId);
      return product && variant ? { ...item, product, variant, lineTotal: product.price * item.qty } : null;
    })
    .filter(Boolean);

  const totalsFor = (cartArr = cart, couponArr = coupon) => {
    const lines = cartLines(cartArr);
    const subtotal = lines.reduce((n, l) => n + l.lineTotal, 0);
    const sellerIds = [...new Set(lines.map((l) => l.product.sellerId))];
    const shipping = sellerIds.length * SHIPPING_PER_SELLER;
    let discount = 0;
    if (couponArr) {
      const scoped = couponArr.sellerId ? lines.filter((l) => l.product.sellerId === couponArr.sellerId) : lines;
      const scopedSubtotal = scoped.reduce((n, l) => n + l.lineTotal, 0);
      discount = couponArr.type === 'flat' ? couponArr.value : Math.round(scopedSubtotal * (couponArr.value / 100));
      discount = Math.min(discount, subtotal);
    }
    const total = subtotal - discount + shipping;
    const codBlocked = total > COD_CAP && sellerIds.some((id) => !SELLERS[id]?.codAllowed);
    return { lines, sellerIds, subtotal, shipping, discount, total, codBlocked };
  };

  // --- coupons (§3: five failure modes + valid, as a `result` enum) --------
  const applyCoupon = (code) => {
    const norm = code.trim().toUpperCase();
    if (norm === EXPIRED_COUPON) return { result: 'expired', message: `${norm} expired at the end of last season.` };
    if (norm === USED_COUPON) return { result: 'used', message: `You've already used ${norm} — it was applied to order ${USED_COUPON_ORDER_REF}.` };
    const c = COUPONS[norm];
    if (!c) return { result: 'invalid', message: `"${code}" is not a code we recognise.` };
    const { subtotal, lines } = totalsFor(cart, null);
    if (c.sellerId && !lines.some((l) => l.product.sellerId === c.sellerId)) {
      return { result: 'scope', message: `${norm} only applies to ${SELLERS[c.sellerId].name} items — your cart has none.` };
    }
    if (subtotal < c.minSubtotal) {
      return { result: 'minimum', message: `Add Rs ${(c.minSubtotal - subtotal).toLocaleString('en-US')} more to use ${norm}.` };
    }
    setCoupon({ code: norm, ...c });
    return { result: 'valid', code: norm };
  };
  const clearCoupon = () => setCoupon(null);

  // --- checkout session (cosmetic countdown — never holds stock, §3) -------
  const beginCheckout = () => {
    setSession({ startedAt: Date.now(), expiresAt: Date.now() + CHECKOUT_SESSION_MINUTES * 60000 });
    setPaymentState('idle');
  };
  const expireSession = () => { setSession(null); setPaymentState('idle'); };

  // --- the one commit path: atomic per-variant stock decrement (§3) --------
  const commitOrder = ({ address, method }) => {
    const { lines, sellerIds, subtotal, shipping, discount, total } = totalsFor(cart, coupon);
    const bySeller = sellerIds.map((id) => lines.filter((l) => l.product.sellerId === id));
    const ref = refFor('ORD');
    setStock((current) => {
      const next = { ...current };
      lines.forEach((l) => {
        const key = stockKey(l.productId, l.variantId);
        next[key] = (current[key] ?? 0) - l.qty;
      });
      return next;
    });
    const subOrders = bySeller.map((sellerLines) => {
      const sellerId = sellerLines[0].product.sellerId;
      const seller = SELLERS[sellerId];
      const sellerSubtotal = sellerLines.reduce((n, l) => n + l.lineTotal, 0);
      return {
        id: genId('so'),
        sellerId,
        sellerName: seller.name,
        items: sellerLines.map((l) => ({ productId: l.productId, title: l.product.title, variant: l.variant.label, qty: l.qty, lineTotal: l.lineTotal })),
        subtotal: sellerSubtotal,
        commission: Math.round(sellerSubtotal * (seller.commissionPct / 100)),
        state: 'packing',
        shipBy: Date.now() + SHIP_WITHIN_DAYS * 86400000,
        courier: null,
        trackingRef: null,
        returned: false,
      };
    });
    setOrders((os) => os.concat({
      ref, subOrders, subtotal, shipping, discount, total, method,
      address, couponCode: coupon?.code || null, at: Date.now(),
    }));
    clearCart();
    setPaymentState('confirmed');
    setSession(null);
    return { kind: 'confirmed', ref };
  };

  // Mirrors BookingContext.resolvePayment's shape/branch order exactly (§3:
  // one shared payment/webhook state machine for tours and gear) — card/
  // amount rules first, then the atomic stock check.
  const resolvePayment = ({ method, methodDetail, address }) => {
    if (!cart.length) return { kind: 'expired' };
    if (session && Date.now() > session.expiresAt) {
      setPaymentState('idle');
      return { kind: 'expired' };
    }
    const digits = (methodDetail || '').replace(/\D/g, '');
    if (method === 'card' && digits === DECLINE_CARD) {
      setPaymentState('failed');
      return { kind: 'failed', reason: FAIL_REASONS.failed };
    }
    if (method === 'card' && digits === FRAUD_CARD) {
      setPaymentState('held');
      return { kind: 'held', reason: FAIL_REASONS.held };
    }
    if ((method === 'jazzcash' || method === 'easypaisa') && digits.endsWith('0000')) {
      setPaymentState('failed');
      return { kind: 'failed', reason: `${method === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'} declined the charge. Nothing was captured.` };
    }
    const { total, lines } = totalsFor(cart, coupon);
    if (method !== 'cod' && total >= FRAUD_AMOUNT_THRESHOLD) {
      setPaymentState('held');
      return { kind: 'held', reason: `Rs ${total.toLocaleString('en-US')} is well above a typical first order — held for a human review.` };
    }
    const shortLine = lines.find((l) => (stock[stockKey(l.productId, l.variantId)] ?? 0) < l.qty);
    if (shortLine) {
      setPaymentState('failed');
      return { kind: 'sold-out', reason: FAIL_REASONS['sold-out'] };
    }
    return commitOrder({ address, method });
  };

  // --- restock notify (§6 sold-out screen) ----------------------------------
  const notifyMe = (productId, variantId) => setNotifyList((l) => l.concat(stockKey(productId, variantId)));

  // --- fulfilment (demo-only advance — same honestly-labeled testing lever
  // pattern as BookingContext.forceOutcome, since no seller-side fulfilment
  // screen exists yet to drive this for real) ------------------------------
  const advanceFulfilment = (orderRef, subOrderId) => {
    setOrders((os) => os.map((o) => (o.ref !== orderRef ? o : {
      ...o,
      subOrders: o.subOrders.map((s) => {
        if (s.id !== subOrderId) return s;
        const i = FULFILMENT_STEPS.indexOf(s.state);
        const nextState = FULFILMENT_STEPS[Math.min(i + 1, FULFILMENT_STEPS.length - 1)];
        return {
          ...s,
          state: nextState,
          courier: nextState !== 'packing' && !s.courier ? 'TCS Courier' : s.courier,
          trackingRef: nextState !== 'packing' && !s.trackingRef ? `TCS${Math.floor(100000 + Math.random() * 900000)}` : s.trackingRef,
        };
      }),
    })));
  };

  // --- returns (§3/§6) -------------------------------------------------------
  // Reads the sub-order once from the surrounding closure (safe — this only
  // ever runs from an event handler, so it sees the latest render's state),
  // decides the outcome, then fires setOrders and setStock as two separate
  // top-level calls. Doing the stock update *inside* the setOrders updater
  // would repeat the exact impure-updater bug §7 documents for
  // BookingContext.payShare — StrictMode double-invokes updaters in dev
  // specifically to catch that, and it would double-restore stock here.
  const submitReturn = (orderRef, subOrderId, reasonId) => {
    const order = orders.find((o) => o.ref === orderRef);
    const subOrder = order?.subOrders.find((s) => s.id === subOrderId);
    if (!subOrder) return null;
    const reason = RETURN_REASONS.find((r) => r.id === reasonId);
    const fee = reason.sellerFault ? 0 : RETURN_SHIPPING_FEE;
    const refund = Math.max(0, subOrder.subtotal - fee);

    setOrders((os) => os.map((o) => (o.ref !== orderRef ? o : {
      ...o,
      subOrders: o.subOrders.map((s) => (s.id !== subOrderId ? s : {
        ...s, returned: true, returnReason: reasonId, returnFee: fee, refund,
      })),
    })));

    setStock((current) => {
      const next = { ...current };
      subOrder.items.forEach((it) => {
        const variant = PRODUCTS.find((p) => p.id === it.productId)?.variants.find((v) => v.label === it.variant);
        if (variant) {
          const key = stockKey(it.productId, variant.id);
          next[key] = (current[key] ?? 0) + it.qty;
        }
      });
      return next;
    });

    return { reason, refund };
  };

  const value = {
    cart, stock, coupon, session, paymentState, orders, notifyList,
    addToCart, setQty, removeFromCart, clearCart,
    cartLines, totalsFor,
    applyCoupon, clearCoupon,
    beginCheckout, expireSession,
    resolvePayment,
    notifyMe,
    advanceFulfilment,
    submitReturn,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}
