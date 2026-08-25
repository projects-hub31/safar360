import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../../context/app/useApp';
import { useBooking } from '../../context/booking/useBooking';
import { refundPct } from '../../data/traveler/tours';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';

const REASONS = [
  { id: 'plans', label: 'My plans changed' },
  { id: 'weather', label: 'Weather or road conditions' },
  { id: 'medical', label: 'Medical reason' },
  { id: 'operator', label: 'Operator issue' },
  { id: 'other', label: 'Something else' },
];

export default function Cancel() {
  const { ref } = useParams();
  const { formatMoney } = useApp();
  const { bookings, cancelBooking } = useBooking();

  const booking = bookings.find((b) => b.ref === ref);
  const [reason, setReason] = useState('plans');
  const [preview, setPreview] = useState(null);
  const [done, setDone] = useState(null);

  const computePreview = (r) => {
    if (!booking) return null;
    // `operator`-caused cancellations always refund in full regardless of
    // the listing's own tier (§3) — everything else runs the date-tiered
    // calculation. Date.now() here only ever runs from an event handler
    // (the reason change below, or this mount-deferred timer) — never from
    // render, which is the one place it isn't safe to call.
    const pct = r === 'operator'
      ? 100
      : refundPct(
        booking.cancellationPolicy,
        booking.departureAt ? Math.max(0, (booking.departureAt - Date.now()) / 3600000) : 999,
      );
    return { pct, amount: Math.round(booking.total * (pct / 100)) };
  };

  useEffect(() => {
    const t = setTimeout(() => setPreview(computePreview('plans')), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking]);

  if (!booking || booking.state !== 'confirmed') {
    return (
      <EmptyState
        title="Nothing to cancel here"
        body="This booking isn't active, or the link is wrong."
        actionLabel="View bookings"
        actionTo="/booking/history"
      />
    );
  }

  const onChangeReason = (r) => {
    setReason(r);
    setPreview(computePreview(r));
  };

  const onConfirm = () => setDone(cancelBooking(ref, reason));

  if (done) {
    return (
      <Card className="mx-auto flex max-w-[440px] flex-col items-start gap-3 p-6">
        <span className="font-display text-xl font-semibold tracking-tight">Booking cancelled</span>
        <p className="text-sm leading-relaxed text-fg-muted">
          {done.pct}% refunded — {formatMoney(done.amount)} on its way back to your original payment method.
        </p>
        <Button to="/booking/history" fullWidth>Back to bookings</Button>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex max-w-[480px] flex-col gap-4">
      <Card className="flex flex-col gap-3 p-5 sm:p-6">
        <strong className="text-sm">Cancel {booking.title}</strong>
        <span className="text-xs text-fg-muted">Ref {booking.ref} · {formatMoney(booking.total)} paid</span>
        <div className="flex flex-col gap-1.5 border-t border-border pt-3">
          {REASONS.map((r) => (
            <label key={r.id} className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="radio"
                name="reason"
                checked={reason === r.id}
                onChange={() => onChangeReason(r.id)}
                className="h-[17px] w-[17px] accent-jade-600"
              />
              {r.label}
            </label>
          ))}
        </div>
      </Card>

      {preview && (
        <Card className="flex flex-col gap-1 p-4 sm:p-5">
          <span className="text-sm text-fg-muted">Refund preview</span>
          <span className="font-mono text-xl font-semibold">
            {formatMoney(preview.amount)} <span className="text-sm font-normal text-fg-muted">({preview.pct}%)</span>
          </span>
          {reason === 'operator' && (
            <span className="text-xs text-fg-subtle">Operator-caused cancellations always refund in full.</span>
          )}
        </Card>
      )}

      <Button variant="destructive" onClick={onConfirm} disabled={!preview}>
        Cancel and refund {preview ? formatMoney(preview.amount) : ''}
      </Button>
    </div>
  );
}
