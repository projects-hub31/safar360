import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../../context/useBooking';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';

const RESOLVE_AFTER_MS = 4000;

const OUTCOME_ROUTE = {
  confirmed: '/booking/confirmed',
  failed: '/booking/failed',
  held: '/booking/held',
  late: '/booking/late-webhook',
  'sold-out': '/booking/sold-out',
  expired: '/booking/expired',
};

const FORCE_OPTIONS = [
  { kind: 'confirmed', label: 'Confirmed' },
  { kind: 'failed', label: 'Failed' },
  { kind: 'held', label: 'Held for review' },
  { kind: 'sold-out', label: 'Sold out (race)' },
  { kind: 'late', label: 'Late webhook' },
];

export default function Awaiting() {
  const navigate = useNavigate();
  const { lock, resolvePayment, forceOutcome } = useBooking();
  const [elapsed, setElapsed] = useState(0);
  const [resolving, setResolving] = useState(false);

  const goToOutcome = (result) => {
    navigate(OUTCOME_ROUTE[result.kind] || '/booking/failed', {
      state: { reason: result.reason, ref: result.ref, tourId: lock?.tourId, title: lock?.title, seats: lock?.seats },
    });
  };

  useEffect(() => {
    if (!lock) return undefined;
    const tick = setInterval(() => setElapsed((s) => s + 1), 1000);
    const resolve = setTimeout(() => {
      setResolving(true);
      goToOutcome(resolvePayment());
    }, RESOLVE_AFTER_MS);
    return () => { clearInterval(tick); clearTimeout(resolve); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lock]);

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

  const onForce = (kind) => {
    setResolving(true);
    goToOutcome(forceOutcome(kind));
  };

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
          <span className="text-xs text-fg-muted">Payment ID</span>
          <span dir="ltr" className="text-end font-mono text-xs">pay_{lock.tourId}{lock.lockToken}</span>
          <span className="text-xs text-fg-muted">Idempotency key</span>
          <span dir="ltr" className="text-end font-mono text-xs">idem_{lock.lockToken}_{lock.seats}</span>
          <span className="text-xs text-fg-muted">Elapsed</span>
          <span dir="ltr" className="text-end font-mono text-xs">{elapsed}s</span>
        </div>
      </Card>

      <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border-loud p-4">
        <span className="font-mono text-[11px] uppercase tracking-wider text-fg-subtle">
          No live payment gateway is connected yet
        </span>
        <p className="text-xs leading-relaxed text-fg-muted">
          It resolves to "Confirmed" automatically in a few seconds. Force a different outcome to see that screen
          now.
        </p>
        <div className="flex flex-wrap gap-2">
          {FORCE_OPTIONS.map((o) => (
            <Button key={o.kind} variant="secondary" size="sm" disabled={resolving} onClick={() => onForce(o.kind)}>
              {o.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
