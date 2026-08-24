import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/useApp';
import { useBooking } from '../../context/useBooking';
import { REQUEST_WINDOW_HOURS } from '../../context/booking-context';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Countdown from '../../components/ui/Countdown';
import EmptyState from '../../components/ui/EmptyState';

export default function AwaitingAccept() {
  const navigate = useNavigate();
  const { formatMoney } = useApp();
  const { requests, acceptRequest, declineRequest } = useBooking();

  const request = [...requests].reverse().find((r) => r.status === 'pending');

  if (!request) {
    return (
      <EmptyState
        title="Nothing waiting on an operator"
        body="Request-to-book trips land here with a 24-hour clock. Find one and ask to book it — you'll see it here."
        actionLabel="Browse trips"
        actionTo="/discover/search"
      />
    );
  }

  const onExpire = () => {
    declineRequest(request.id, 'No response within 24 hours');
    navigate('/booking/declined', { state: { tourId: request.tourId, title: request.title, reason: 'The operator did not respond within 24 hours. Full refund — no seats were ever held.' } });
  };

  const onAccept = () => {
    const ref = acceptRequest(request.id);
    navigate('/booking/confirmed', { state: { ref } });
  };

  const onDecline = (reason) => {
    declineRequest(request.id, reason);
    navigate('/booking/declined', { state: { tourId: request.tourId, title: request.title, reason: `The operator declined: "${reason}"` } });
  };

  return (
    <div className="mx-auto flex max-w-[480px] flex-col gap-4">
      <Card className="flex flex-col gap-3 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="font-display text-lg font-semibold tracking-tight">{request.title}</span>
          <span className="flex items-center gap-1.5 text-sm text-fg-muted">
            <Countdown key={request.id} seconds={REQUEST_WINDOW_HOURS * 3600} urgentAt={3600} onExpire={onExpire} />
          </span>
        </div>
        <span className="text-sm text-fg-muted">
          {request.seats} seat{request.seats === 1 ? '' : 's'} · {formatMoney(request.price * request.seats)}
        </span>
        <div className="rounded-xl border border-info bg-info-soft px-3.5 py-2.5 text-[13px] leading-relaxed text-info-text">
          No seats are deducted yet and you have not been charged. The operator has 24 hours to respond.
        </div>
      </Card>

      <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border-loud p-4">
        <span className="font-mono text-[11px] uppercase tracking-wider text-fg-subtle">
          No vendor inbox is built yet (module 04)
        </span>
        <p className="text-xs leading-relaxed text-fg-muted">
          In production the operator answers from their own dashboard. Until that exists, decide here.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={onAccept}>Accept — deducts {request.seats} seat{request.seats === 1 ? '' : 's'}</Button>
          <Button size="sm" variant="secondary" onClick={() => onDecline('Below my minimum group size')}>Decline</Button>
        </div>
      </div>
    </div>
  );
}
