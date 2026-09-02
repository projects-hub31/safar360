import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../../context/booking/useBooking';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';

const POLL_MS = 1000;

const OUTCOME_ROUTE = {
  confirmed: '/booking/confirmed',
  failed: '/booking/failed',
  held: '/booking/held',
  late: '/booking/late-webhook',
  'sold-out': '/booking/sold-out',
  expired: '/booking/expired',
};

export default function Awaiting() {
  const navigate = useNavigate();
  const { lock, checkBookingStatus, fetchHistory } = useBooking();
  const [elapsed, setElapsed] = useState(0);
  const settled = useRef(false);

  useEffect(() => {
    if (!lock?.ref) return undefined;
    settled.current = false;
    const tick = setInterval(() => setElapsed((s) => s + 1), 1000);

    const poll = setInterval(async () => {
      if (settled.current) return;
      const result = await checkBookingStatus(lock.ref);
      if (result.kind === 'pending' || settled.current) return;
      settled.current = true;
      clearInterval(poll);
      clearInterval(tick);
      if (result.kind === 'confirmed') await fetchHistory();
      navigate(OUTCOME_ROUTE[result.kind] || '/booking/failed', {
        state: { reason: result.reason, ref: result.ref, tourId: lock.tourId, title: lock.title, seats: lock.seats },
      });
    }, POLL_MS);

    return () => { clearInterval(tick); clearInterval(poll); };
  }, [lock?.ref, lock?.tourId, lock?.title, lock?.seats, checkBookingStatus, fetchHistory, navigate]);

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
    <div className="mx-auto flex max-w-[460px] flex-col gap-4">
      <Card className="flex flex-col items-center gap-4 p-8 text-center">
        <span
          aria-hidden="true"
          className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary border-t-transparent"
        />
        <span className="font-display text-xl font-semibold tracking-tight">Confirming with your bank</span>
        <p className="text-sm leading-relaxed text-fg-muted">
          Usually under a minute. You'll get an SMS either way — you're never charged twice.
        </p>
        <div className="grid w-full grid-cols-2 gap-2.5 border-t border-border pt-4 text-start">
          <span className="text-xs text-fg-muted">Reference</span>
          <span dir="ltr" className="text-end font-mono text-xs">{lock.ref || 'starting…'}</span>
          <span className="text-xs text-fg-muted">Elapsed</span>
          <span dir="ltr" className="text-end font-mono text-xs">{elapsed}s</span>
        </div>
      </Card>

      <p className="text-center text-xs leading-relaxed text-fg-muted">
        This page polls our server every second — the outcome is decided by a real signed webhook, not by
        anything running in your browser. The bank call itself is simulated (no live Stripe/JazzCash yet).
      </p>
    </div>
  );
}
