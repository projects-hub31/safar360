import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useVendor } from '../../context/useVendor';
import { useApp } from '../../context/useApp';
import { PLANS, SALES_TAX_PCT } from '../../context/vendor-context';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ChoiceCard from '../../components/ui/ChoiceCard';
import TextField from '../../components/ui/TextField';
import Toggle from '../../components/ui/Toggle';

const METHODS = [
  { id: 'card', name: 'Card', placeholder: '4242 4242 4242 4242' },
  { id: 'jazzcash', name: 'JazzCash', placeholder: '0300 4821776' },
  { id: 'bank', name: 'Bank transfer', placeholder: 'PK36 SCBL 0000 0011 2345 6702' },
];

export default function Subscribe() {
  const location = useLocation();
  const navigate = useNavigate();
  const { subscribe } = useVendor();
  const { formatMoney } = useApp();

  const [plan, setPlan] = useState(location.state?.plan || PLANS[0].id);
  const [method, setMethod] = useState(null);
  const [detail, setDetail] = useState('');
  const [autoRenew, setAutoRenew] = useState(true);

  const chosen = PLANS.find((p) => p.id === plan);
  const tax = Math.round(chosen.price * (SALES_TAX_PCT / 100));
  const total = chosen.price + tax;
  const canPay = method && detail.trim().length >= 5;

  const onPay = () => {
    subscribe(plan);
    navigate('/vendor/dashboard');
  };

  return (
    <div className="mx-auto flex max-w-[480px] flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Subscription checkout</h1>

      <Card className="flex flex-col gap-2 p-4 sm:p-5">
        <strong className="text-sm">Plan</strong>
        <div className="flex flex-col gap-2">
          {PLANS.map((p) => (
            <ChoiceCard key={p.id} active={plan === p.id} onClick={() => setPlan(p.id)} title={p.name} subtitle={`${p.commissionPct}% commission`} meta={`Rs ${p.price.toLocaleString('en-US')}/mo`} />
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-3 p-4 sm:p-5">
        <strong className="text-sm">Payment method</strong>
        <div className="grid grid-cols-3 gap-2">
          {METHODS.map((m) => (
            <ChoiceCard key={m.id} active={method === m.id} onClick={() => { setMethod(m.id); setDetail(''); }} title={m.name} />
          ))}
        </div>
        {method && (
          <TextField
            label={METHODS.find((m) => m.id === method).name + ' number'}
            dir="ltr"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder={METHODS.find((m) => m.id === method).placeholder}
          />
        )}
        <Toggle id="auto-renew" label="Auto-renew" description="Charges 3 days before expiry" checked={autoRenew} onChange={setAutoRenew} />
      </Card>

      <Card className="flex flex-col gap-1.5 p-4 sm:p-5">
        <div className="flex justify-between text-[13px] text-fg-muted">
          <span>{chosen.name} plan</span>
          <span className="font-mono">{formatMoney(chosen.price)}</span>
        </div>
        <div className="flex justify-between text-[13px] text-fg-muted">
          <span>Sales tax ({SALES_TAX_PCT}%)</span>
          <span className="font-mono">{formatMoney(tax)}</span>
        </div>
        <div className="mt-0.5 flex justify-between border-t-4 border-accent pt-2 text-[15px] font-bold">
          <span>Total</span>
          <span className="font-mono">{formatMoney(total)}</span>
        </div>
      </Card>

      <Button onClick={onPay} disabled={!canPay} size="lg" fullWidth>
        Pay {formatMoney(total)}
      </Button>
    </div>
  );
}
