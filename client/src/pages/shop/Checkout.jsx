import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/useApp';
import { useShop } from '../../context/useShop';
import { CHECKOUT_SESSION_MINUTES } from '../../context/shop-context';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import SelectField from '../../components/ui/SelectField';
import ChoiceCard from '../../components/ui/ChoiceCard';
import Countdown from '../../components/ui/Countdown';
import EmptyState from '../../components/ui/EmptyState';

const CITIES = ['Islamabad', 'Lahore', 'Karachi', 'Peshawar', 'Gilgit', 'Skardu', 'Quetta'];

const METHODS = [
  { id: 'jazzcash', name: 'JazzCash', field: 'Mobile account number', placeholder: '0300 4821776', help: "You'll get a push notification in the JazzCash app." },
  { id: 'easypaisa', name: 'EasyPaisa', field: 'Mobile account number', placeholder: '0345 2210094', help: 'A 5-digit PIN prompt appears on your phone.' },
  { id: 'card', name: 'Card', field: 'Card number', placeholder: '4242 4242 4242 4242', help: '3-D Secure may ask your bank to confirm.' },
  { id: 'cod', name: 'Cash on delivery', field: null, placeholder: null, help: 'Pay the courier when your parcel arrives.' },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { formatMoney } = useApp();
  const { cartLines, totalsFor, beginCheckout, expireSession, session, resolvePayment } = useShop();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState(CITIES[0]);
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState(null);
  const [detail, setDetail] = useState('');
  const [processing, setProcessing] = useState(false);

  const lines = cartLines();
  const totals = totalsFor();

  useEffect(() => {
    // Deferred to a timeout rather than called synchronously in the effect
    // body — this project's react-hooks/set-state-in-effect rule (§7 client
    // conventions) wants an effect's only *synchronous* job to be starting
    // something, not calling setState directly.
    if (!lines.length) return undefined;
    const t = setTimeout(() => beginCheckout(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!lines.length) {
    return (
      <EmptyState
        title="Nothing to check out"
        body="Your cart is empty — add something from the catalog first."
        actionLabel="Browse gear"
        actionTo="/shop/catalog"
      />
    );
  }

  const codDisabled = totals.codBlocked;
  const availableMethods = METHODS.filter((m) => m.id !== 'cod' || !codDisabled);
  const activeMethod = availableMethods.find((m) => m.id === method);
  const addressValid = name.trim() && address.trim() && phone.replace(/\D/g, '').length >= 10;
  const methodValid = method === 'cod' || (method && detail.trim().length >= 5);
  const canPay = addressValid && methodValid;

  const onExpire = () => {
    expireSession();
    navigate('/shop/expired');
  };

  const onPay = () => {
    if (!canPay || processing) return;
    setProcessing(true);
    // A brief simulated gateway delay — gear has no separate Gateway/Awaiting
    // screen of its own (§5 route table), so the wait lives inline here.
    setTimeout(() => {
      const result = resolvePayment({ method, methodDetail: method === 'cod' ? 'cod' : detail, address: { name, address, city, phone } });
      setProcessing(false);
      if (result.kind === 'confirmed') navigate('/shop/order', { state: { ref: result.ref } });
      else if (result.kind === 'expired') navigate('/shop/expired');
      else navigate(`/shop/${result.kind}`, { state: { reason: result.reason } });
    }, 1400);
  };

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border-strong bg-surface px-4 py-3">
        <span className="text-sm font-semibold text-fg">Checkout session</span>
        {session && (
          <span className="flex items-center gap-2 text-sm text-fg-muted">
            <Countdown key={session.startedAt} seconds={CHECKOUT_SESSION_MINUTES * 60} urgentAt={120} onExpire={onExpire} />
          </span>
        )}
      </div>
      <p className="-mt-2 text-xs leading-relaxed text-fg-muted">
        Unlike a tour hold, nothing here reserves your stock — if the session times out, nothing is released because
        nothing was ever taken. Your cart stays exactly as it is.
      </p>

      <Card className="flex flex-col gap-3 p-4 sm:p-5">
        <strong className="text-sm">Delivery address</strong>
        <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
        <div className="grid grid-cols-2 gap-2.5">
          <SelectField label="City" value={city} onChange={(e) => setCity(e.target.value)} options={CITIES.map((c) => ({ value: c, label: c }))} />
          <TextField label="Phone" prefix="+92" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="300 4821776" />
        </div>
      </Card>

      <Card className="flex flex-col gap-3 p-4 sm:p-5">
        <strong className="text-sm">Payment method</strong>
        {codDisabled && (
          <div className="rounded-lg border border-warning bg-warning-soft px-3 py-2 text-xs leading-relaxed text-warning-text">
            Cash on delivery isn't available for this order — the total is over {formatMoney(20000)} and at least one
            seller in your cart doesn't support COD on any order size.
          </div>
        )}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {availableMethods.map((m) => (
            <ChoiceCard key={m.id} active={method === m.id} onClick={() => { setMethod(m.id); setDetail(''); }} title={m.name} subtitle={m.field || 'No card or wallet needed'} />
          ))}
        </div>
        {activeMethod?.field && (
          <TextField label={activeMethod.field} dir="ltr" value={detail} onChange={(e) => setDetail(e.target.value)} placeholder={activeMethod.placeholder} helper={activeMethod.help} />
        )}
        {method === 'cod' && <p className="text-xs text-fg-muted">{METHODS.find((m) => m.id === 'cod').help}</p>}
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
          <span>Shipping</span>
          <span className="font-mono">{formatMoney(totals.shipping)}</span>
        </div>
        <div className="mt-0.5 flex justify-between border-t-4 border-accent pt-2 text-[15px] font-bold">
          <span>Total</span>
          <span className="font-mono">{formatMoney(totals.total)}</span>
        </div>
      </Card>

      <Button onClick={onPay} disabled={!canPay} loading={processing} size="lg" fullWidth>
        {processing ? 'Processing payment…' : `Pay ${formatMoney(totals.total)}`}
      </Button>
      <p className="text-center text-xs leading-relaxed text-fg-muted">
        Your order is confirmed by our server, not by this page.
      </p>
    </div>
  );
}
