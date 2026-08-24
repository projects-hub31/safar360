import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/useApp';
import { useBooking } from '../../context/useBooking';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import ChoiceCard from '../../components/ui/ChoiceCard';
import StatusPill from '../../components/ui/StatusPill';
import Countdown from '../../components/ui/Countdown';
import EmptyState from '../../components/ui/EmptyState';
import { CNIC_ERROR, isValidCnic } from '../../utils/validators';

const METHODS = [
  { id: 'jazzcash', name: 'JazzCash', field: 'Mobile account number', placeholder: '0300 4821776', help: "You'll get a push notification in the JazzCash app." },
  { id: 'easypaisa', name: 'EasyPaisa', field: 'Mobile account number', placeholder: '0345 2210094', help: 'A 5-digit PIN prompt appears on your phone.' },
  { id: 'card', name: 'Card', field: 'Card number', placeholder: '4242 4242 4242 4242', help: '3-D Secure may ask your bank to confirm.' },
  { id: 'bank', name: 'Bank transfer', field: 'IBAN', placeholder: 'PK36 SCBL 0000 0011 2345 6702', help: 'Confirms next working day — the one method that extends your hold instead of letting it expire.' },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { formatMoney } = useApp();
  const { lock, applyPromo, chooseMethod, setGuests, beginCapture, expireLock, totalsFor } = useBooking();

  const [guestRows, setGuestRows] = useState(() =>
    lock ? Array.from({ length: lock.seats }, (_, i) => lock.guests[i] || { name: '', cnic: '' }) : [],
  );
  const [touched, setTouched] = useState({});
  const [promoInput, setPromoInput] = useState('');
  const [promoMsg, setPromoMsg] = useState(null);
  const [detail, setDetail] = useState('');

  if (!lock) {
    return (
      <EmptyState
        title="Nothing to check out"
        body="Holds start from a tour or property page. Find a trip and hold your seats — you'll land back here with ten minutes on the clock."
        actionLabel="Browse trips"
        actionTo="/discover/search"
      />
    );
  }

  const method = METHODS.find((m) => m.id === lock.method);
  const totals = totalsFor(lock);

  const updateGuest = (i, field, value) => {
    setGuestRows((rows) => rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  };

  const guestsValid = guestRows.every((g) => g.name.trim() && isValidCnic(g.cnic));
  const methodValid = lock.method && detail.trim().length >= 5;
  const canPay = guestsValid && methodValid;

  const onSelectMethod = (id) => {
    chooseMethod(id, '');
    setDetail('');
  };

  const onDetailChange = (v) => {
    setDetail(v);
    chooseMethod(lock.method, v);
  };

  const onApplyPromo = () => {
    if (!promoInput.trim()) return;
    const result = applyPromo(promoInput);
    setPromoMsg(result.ok ? { ok: true, text: `${promoInput.trim().toUpperCase()} applied — ${result.pct}% off.` } : { ok: false, text: result.message });
  };

  const onExpire = () => {
    const { tourId, title } = lock;
    expireLock();
    navigate('/booking/expired', { state: { tourId, title } });
  };

  const onPay = () => {
    setGuests(guestRows);
    beginCapture();
    navigate('/booking/gateway');
  };

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border-strong bg-surface px-4 py-3">
        <span className="text-sm font-semibold text-fg">{lock.title}</span>
        {lock.extended ? (
          <StatusPill tone="info">Extended — confirms next working day</StatusPill>
        ) : (
          <span className="flex items-center gap-2 text-sm text-fg-muted">
            Held for <Countdown key={lock.lockToken} seconds={lock.minutes * 60} urgentAt={120} onExpire={onExpire} />
          </span>
        )}
      </div>

      <Card className="flex flex-col gap-3 p-4 sm:p-5">
        <strong className="text-sm">Traveller details</strong>
        <p className="-mt-1.5 text-xs text-fg-muted">Names must match the CNIC or passport used for travel.</p>
        {guestRows.map((g, i) => (
          <div key={i} className="grid grid-cols-1 gap-2.5 border-t border-border pt-3 first:border-0 first:pt-0 sm:grid-cols-2">
            <TextField
              label={`Traveller ${i + 1} — full name`}
              value={g.name}
              onChange={(e) => updateGuest(i, 'name', e.target.value)}
            />
            <TextField
              label="CNIC or passport"
              dir="ltr"
              value={g.cnic}
              onChange={(e) => updateGuest(i, 'cnic', e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, [i]: true }))}
              placeholder="00000-0000000-0"
              error={touched[i] && !isValidCnic(g.cnic) ? CNIC_ERROR : null}
            />
          </div>
        ))}
      </Card>

      <Card className="flex flex-col gap-3 p-4 sm:p-5">
        <strong className="text-sm">Payment method</strong>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {METHODS.map((m) => (
            <ChoiceCard key={m.id} active={lock.method === m.id} onClick={() => onSelectMethod(m.id)} title={m.name} subtitle={m.field} />
          ))}
        </div>
        {method && (
          <TextField
            label={method.field}
            dir="ltr"
            value={detail}
            onChange={(e) => onDetailChange(e.target.value)}
            placeholder={method.placeholder}
            helper={method.help}
          />
        )}
      </Card>

      <Card className="flex flex-col gap-2.5 p-4 sm:p-5">
        <strong className="text-sm">Promo code</strong>
        <div className="flex gap-2">
          <TextField
            className="flex-1"
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value)}
            placeholder="NORTH10"
          />
          <Button variant="secondary" onClick={onApplyPromo}>Apply</Button>
        </div>
        {promoMsg && (
          <span className={`text-xs ${promoMsg.ok ? 'text-success-text' : 'text-danger-text'}`}>{promoMsg.text}</span>
        )}
      </Card>

      <Card className="flex flex-col gap-1.5 p-4 sm:p-5">
        <div className="flex justify-between text-[13px] text-fg-muted">
          <span>{formatMoney(lock.price)} × {lock.seats}</span>
          <span className="font-mono">{formatMoney(totals.subtotal)}</span>
        </div>
        {totals.discount > 0 && (
          <div className="flex justify-between text-[13px] text-success-text">
            <span>Promo discount</span>
            <span className="font-mono">− {formatMoney(totals.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-[13px] text-fg-muted">
          <span>Service fee</span>
          <span className="font-mono">{formatMoney(totals.fee)}</span>
        </div>
        <div className="mt-0.5 flex justify-between border-t-4 border-accent pt-2 text-[15px] font-bold">
          <span>Total</span>
          <span className="font-mono">{formatMoney(totals.total)}</span>
        </div>
      </Card>

      <Button onClick={onPay} disabled={!canPay} size="lg" fullWidth>
        Pay {formatMoney(totals.total)}
      </Button>
      <p className="text-center text-xs leading-relaxed text-fg-muted">
        Your booking is confirmed by our server, not by this page.
      </p>
    </div>
  );
}
