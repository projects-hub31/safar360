import { useEffect } from 'react';
import { useAuth } from '../../context/auth/useAuth';
import { useVendor } from '../../context/vendor/useVendor';
import { useApp } from '../../context/app/useApp';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';

export default function Dashboard() {
  const { user } = useAuth();
  const {
    subscription, fetchSubscription, ledger, fetchLedger, inbox, fetchInbox, analytics, fetchAnalytics,
  } = useVendor();
  const { formatMoney } = useApp();

  useEffect(() => {
    fetchSubscription();
    fetchLedger();
    fetchInbox();
    fetchAnalytics();
    // Runs once on mount — all four actions are stable (useCallback, no deps).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gateOk = user?.kycStatus === 'approved' && (subscription.state === 'active' || subscription.state === 'grace');
  const bannerTone = user?.kycStatus === 'rejected' || subscription.state === 'suspended' ? 'danger' : !gateOk ? 'warning' : 'success';
  const bannerText = gateOk
    ? 'Publishing is open — your listings can go live.'
    : user?.kycStatus !== 'approved'
      ? `Identity verification is ${user?.kycStatus || 'not started'} — publishing is blocked until it's approved.`
      : `Your subscription is ${subscription.state || 'not started'} — publishing is blocked.`;

  const awaiting = inbox.filter((r) => r.status === 'pending').length;
  const confirmedThisMonth = analytics?.monthly?.length ? analytics.monthly[analytics.monthly.length - 1].bookings : 0;
  const acceptanceRateDisplay = analytics?.acceptanceRate != null ? `${analytics.acceptanceRate}%` : '—';
  const netEarned = analytics?.netEarned ?? 0;
  const accruing = ledger.filter((l) => l.state === 'accruing' || l.state === 'pending').reduce((n, l) => n + l.net, 0);
  const totalGross = ledger.reduce((n, l) => n + l.gross, 0);
  const totalCommission = ledger.reduce((n, l) => n + l.commission, 0);
  const totalNet = ledger.reduce((n, l) => n + l.net, 0);

  return (
    <div className="mx-auto flex max-w-[860px] flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Vendor dashboard</h1>
        <p className="text-sm text-fg-muted">{user?.kyc?.businessName || 'Your business'}</p>
      </div>

      <Card className={`flex items-center justify-between gap-3 p-4 ${bannerTone === 'danger' ? 'border-danger' : bannerTone === 'success' ? 'border-success' : 'border-warning'}`}>
        <span className="text-sm">{bannerText}</span>
        <StatusPill tone={bannerTone}>{gateOk ? 'Open' : 'Blocked'}</StatusPill>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="flex flex-col gap-1 p-4">
          <span className="font-mono text-2xl font-semibold">{awaiting}</span>
          <span className="text-xs text-fg-muted">Awaiting your answer</span>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <span className="font-mono text-2xl font-semibold">{confirmedThisMonth}</span>
          <span className="text-xs text-fg-muted">Confirmed this month</span>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <span className="font-mono text-2xl font-semibold">{acceptanceRateDisplay}</span>
          <span className="text-xs text-fg-muted">Acceptance rate</span>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <span className="font-mono text-2xl font-semibold">{formatMoney(netEarned)}</span>
          <span className="text-xs text-fg-muted">Net earned</span>
        </Card>
      </div>

      <Card className="flex flex-col gap-2 p-4 sm:p-5">
        <strong className="text-sm">Payout summary</strong>
        <p className="text-xs leading-relaxed text-fg-muted">
          Released every Tuesday. Gross and net always shown together — you should never have to do this
          arithmetic yourself.
        </p>
        <div className="grid grid-cols-3 gap-3 border-t border-border pt-3 text-sm">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-fg-muted">Gross</span>
            <span className="font-mono font-semibold">{formatMoney(totalGross)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-fg-muted">Commission</span>
            <span className="font-mono font-semibold text-danger-text">− {formatMoney(totalCommission)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-fg-muted">Net to you</span>
            <span className="font-mono font-semibold text-success-text">{formatMoney(totalNet)}</span>
          </div>
        </div>
        <span className="text-xs text-fg-subtle">{formatMoney(accruing)} still accruing or pending release.</span>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button to="/vendor/inbox">Inbox {awaiting > 0 ? `(${awaiting})` : ''}</Button>
        <Button to="/vendor/listings" variant="secondary">My listings</Button>
        <Button to="/vendor/payouts" variant="secondary">Payouts</Button>
        <Button to="/vendor/analytics" variant="secondary">Analytics</Button>
      </div>
    </div>
  );
}
