import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/app/useApp';
import { useBooking } from '../../context/booking/useBooking';
import { DECLINE_REASONS } from '../../context/vendor/vendor-context';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SelectField from '../../components/ui/SelectField';
import StatusPill from '../../components/ui/StatusPill';
import Countdown from '../../components/ui/Countdown';
import EmptyState from '../../components/ui/EmptyState';
import { REQUEST_WINDOW_HOURS } from '../../context/booking/booking-context';

function maskCnic(cnic) {
  const m = /^(\d{5})-(\d{7})-(\d)$/.exec(cnic);
  if (!m) return cnic;
  return `${m[1]}-•••••••-${m[3]}`;
}

export default function BookingDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { formatMoney } = useApp();
  const { requests, acceptRequest, declineRequest } = useBooking();
  const [reason, setReason] = useState('');

  const req = requests.find((r) => r.id === location.state?.requestId);

  if (!req) {
    return (
      <EmptyState title="Request not found" body="Open this from the inbox." actionLabel="Back to inbox" actionTo="/vendor/inbox" />
    );
  }

  const onAccept = () => {
    acceptRequest(req.id);
    navigate('/vendor/inbox');
  };

  const onDecline = () => {
    if (!reason) return;
    declineRequest(req.id, DECLINE_REASONS.find((r) => r.id === reason).label);
    navigate('/vendor/inbox');
  };

  return (
    <div className="mx-auto flex max-w-[560px] flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{req.title}</h1>
        <StatusPill tone={req.status === 'pending' ? 'warning' : req.status === 'accepted' ? 'success' : 'danger'}>{req.status}</StatusPill>
      </div>

      {req.status === 'pending' && (
        <div className="flex items-center gap-2 rounded-xl border border-warning bg-warning-soft px-4 py-3 text-sm text-warning-text">
          Time to answer <Countdown seconds={REQUEST_WINDOW_HOURS * 3600} urgentAt={21600} />
        </div>
      )}

      <Card className="flex flex-col gap-2.5 p-4 sm:p-5">
        <div className="flex justify-between text-sm"><span className="text-fg-muted">Seats</span><span className="font-mono">{req.seats}</span></div>
        <div className="flex justify-between text-sm"><span className="text-fg-muted">Gross</span><span className="font-mono">{formatMoney(req.price * req.seats)}</span></div>
        <div className="border-t border-border pt-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">Travellers</span>
          {(req.guests || []).map((g, i) => (
            <div key={i} className="flex justify-between py-1 text-sm">
              <span>{g.name}</span>
              <span dir="ltr" className="font-mono text-fg-muted">{maskCnic(g.cnic)}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="rounded-xl border border-info bg-info-soft px-4 py-3 text-[13px] leading-relaxed text-info-text">
        No seats have been deducted yet. Nobody has been charged either. Accepting deducts {req.seats} seat{req.seats === 1 ? '' : 's'}
        {' '}and confirms the booking; declining or letting the clock run out costs the traveller nothing and never held a seat.
      </div>

      {req.status === 'pending' && (
        <Card className="flex flex-col gap-3 p-4 sm:p-5">
          <Button onClick={onAccept} fullWidth>Accept — deducts {req.seats} seat{req.seats === 1 ? '' : 's'}</Button>
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <SelectField
              label="Decline reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              options={[{ value: '', label: 'Choose a reason…' }, ...DECLINE_REASONS.map((r) => ({ value: r.id, label: r.label }))]}
            />
            <Button variant="destructive" onClick={onDecline} disabled={!reason}>Decline</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
