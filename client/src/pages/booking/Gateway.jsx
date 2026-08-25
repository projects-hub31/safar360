import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../../context/booking/useBooking';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';

const METHOD_LABEL = { jazzcash: 'JazzCash', easypaisa: 'EasyPaisa', card: 'your card issuer', bank: 'your bank' };
const LADDER = [
  { id: 'initiated', label: 'Initiated' },
  { id: 'authorized', label: 'Authorized' },
  { id: 'captured', label: 'Awaiting confirmation' },
];

export default function Gateway() {
  const navigate = useNavigate();
  const { lock } = useBooking();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!lock) return undefined;
    const t1 = setTimeout(() => setStep(1), 900);
    const t2 = setTimeout(() => setStep(2), 1800);
    const t3 = setTimeout(() => navigate('/booking/awaiting'), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [lock, navigate]);

  if (!lock) {
    return (
      <EmptyState
        title="Nothing in progress"
        body="There's no payment in flight — start from a tour page."
        actionLabel="Browse trips"
        actionTo="/discover/search"
      />
    );
  }

  return (
    <Card className="mx-auto flex max-w-[440px] flex-col items-center gap-5 p-8 text-center">
      <span className="font-mono text-[11px] uppercase tracking-wider text-fg-subtle">
        Leaving safar360 · connecting to {METHOD_LABEL[lock.method] || 'your payment provider'}
      </span>
      <span
        aria-hidden="true"
        className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary border-t-transparent"
      />
      <div className="flex w-full flex-col gap-2">
        {LADDER.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2.5 text-sm">
            <span
              className={`grid h-5 w-5 flex-none place-items-center rounded-full text-[10px] font-bold ${
                i < step ? 'bg-success text-white' : i === step ? 'bg-primary text-primary-on' : 'bg-sunken text-fg-subtle'
              }`}
            >
              {i < step ? '✓' : i + 1}
            </span>
            <span className={i <= step ? 'font-semibold text-fg' : 'text-fg-subtle'}>{s.label}</span>
          </div>
        ))}
      </div>
      <p className="text-xs leading-relaxed text-fg-muted">
        Your hold keeps running while you're here. If it expires before confirmation lands, you're refunded
        automatically — never overbooked.
      </p>
    </Card>
  );
}
