import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVendor } from '../../context/vendor/useVendor';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';
import Countdown from '../../components/ui/Countdown';

export default function Grace() {
  const navigate = useNavigate();
  const {
    subscription, fetchSubscription, simulateChargeFailure, exhaustRetries, retryCharge, onGraceExpire, cancelSubscription,
  } = useVendor();

  useEffect(() => {
    fetchSubscription();
    // Runs once on mount — fetchSubscription is stable (useCallback, no deps).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (subscription.state !== 'grace') {
    return (
      <Card className="mx-auto flex max-w-[440px] flex-col items-start gap-3 p-6">
        <span className="font-display text-xl font-semibold tracking-tight">Not in a grace period</span>
        <p className="text-sm leading-relaxed text-fg-muted">
          Your subscription is <StatusPill tone="neutral">{subscription.state || 'not started'}</StatusPill>. Grace
          starts automatically after a charge fails and retries are exhausted — there's no live recurring billing
          here yet, so use the testing levers below to see it.
        </p>
        {subscription.state === 'active' && (
          <Button variant="secondary" onClick={simulateChargeFailure}>Simulate a charge failure</Button>
        )}
        {subscription.state === 'past_due' && (
          <Button variant="secondary" onClick={exhaustRetries}>Simulate retries exhausted</Button>
        )}
        <Button to="/vendor/plans">View plans</Button>
      </Card>
    );
  }

  return (
    <Card className="mx-auto flex max-w-[440px] flex-col items-start gap-4 p-6">
      <StatusPill tone="warning">Grace period</StatusPill>
      <span className="font-display text-xl font-semibold tracking-tight">Update your payment method</span>
      <p className="text-sm leading-relaxed text-fg-muted">
        The card on file was declined. Your listings are still live — nothing is deleted. You can't publish
        anything new until this clears.
      </p>
      <div className="flex items-center gap-2 rounded-xl border border-warning bg-warning-soft px-4 py-3">
        <span className="text-sm text-warning-text">Time left</span>
        <Countdown
          key={subscription.graceToken}
          seconds={subscription.graceRemainingSeconds}
          urgentAt={86400}
          onExpire={onGraceExpire}
        />
      </div>
      <div className="flex w-full gap-2">
        <Button onClick={async () => { await retryCharge(); navigate('/vendor/dashboard'); }} fullWidth>Retry payment</Button>
        <Button variant="destructive" onClick={async () => { await cancelSubscription(); navigate('/vendor/plans'); }} fullWidth>Cancel</Button>
      </div>
    </Card>
  );
}
