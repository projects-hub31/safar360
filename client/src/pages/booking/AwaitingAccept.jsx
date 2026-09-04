import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/app/useApp';
import { useBooking } from '../../context/booking/useBooking';
import Card from '../../components/ui/Card';
import Countdown from '../../components/ui/Countdown';
import EmptyState from '../../components/ui/EmptyState';

const POLL_MS = 1000;

// request-mode's own outcome map — a request never reaches the payment-
// specific outcomes (failed/held/sold-out/late), only confirmed or declined
// (§3 lead lifecycle: no lock, no charge, until the vendor decides).
const OUTCOME_ROUTE = {
  confirmed: '/booking/confirmed',
  declined: '/booking/declined',
};

function remainingSeconds(deadlineAt) {
  return Math.max(0, Math.round((new Date(deadlineAt).getTime() - Date.now()) / 1000));
}

export default function AwaitingAccept() {
  const location = useLocation();
  const navigate = useNavigate();
  const { formatMoney } = useApp();
  const { checkBookingStatus, fetchHistory } = useBooking();
  const settled = useRef(false);

  const { ref, deadlineAt, title, seats, pricePerSeat, tourId } = location.state || {};
  const [secondsLeft] = useState(() => (deadlineAt ? remainingSeconds(deadlineAt) : 0));

  useEffect(() => {
    if (!ref) return undefined;
    settled.current = false;

    const poll = setInterval(async () => {
      if (settled.current) return;
      const result = await checkBookingStatus(ref);
      if (result.kind === 'pending' || settled.current) return;
      settled.current = true;
      clearInterval(poll);
      if (result.kind === 'confirmed') await fetchHistory();
      navigate(OUTCOME_ROUTE[result.kind] || '/booking/declined', {
        state: {
          ref,
          tourId,
          title,
          reason: result.reason || (result.kind === 'declined'
            ? 'The operator declined this request. Nothing was ever charged.'
            : undefined),
        },
      });
    }, POLL_MS);

    return () => clearInterval(poll);
  }, [ref, title, tourId, checkBookingStatus, fetchHistory, navigate]);

  if (!ref) {
    return (
      <EmptyState
        title="Nothing waiting on an operator"
        body="Request-to-book trips land here with a 24-hour clock. Find one and ask to book it — you'll see it here."
        actionLabel="Browse trips"
        actionTo="/discover/search"
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-[480px] flex-col gap-4">
      <Card className="flex flex-col gap-3 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="font-display text-lg font-semibold tracking-tight">{title}</span>
          <span className="flex items-center gap-1.5 text-sm text-fg-muted">
            <Countdown key={ref} seconds={secondsLeft} urgentAt={3600} />
          </span>
        </div>
        {seats != null && pricePerSeat != null && (
          <span className="text-sm text-fg-muted">
            {seats} seat{seats === 1 ? '' : 's'} · {formatMoney(pricePerSeat * seats)}
          </span>
        )}
        <div className="rounded-xl border border-info bg-info-soft px-3.5 py-2.5 text-[13px] leading-relaxed text-info-text">
          No seats are deducted yet and you have not been charged. The operator has 24 hours to respond.
        </div>
      </Card>

      <p className="text-center text-xs leading-relaxed text-fg-muted">
        This page polls our server every second — the operator answers from their own inbox (Vendor → Bookings).
        If the window runs out with no answer, this auto-declines with a full refund of nothing, since nothing
        was ever charged.
      </p>
    </div>
  );
}
