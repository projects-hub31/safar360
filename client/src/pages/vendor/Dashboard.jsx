import { useAuth } from '../../context/useAuth';
import { useBooking } from '../../context/useBooking';
import { useVendor } from '../../context/useVendor';
import { useApp } from '../../context/useApp';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';

// Seeded demo KPIs beside the one genuinely live figure (awaiting-answer
// count, from BookingContext's real request queue) — see VendorContext.jsx
// for why the rest aren't derived from a real booking loop yet.
const DEMO_KPIS = { confirmedThisMonth: 14, acceptanceRatePct: 92, netEarnedMonth: 611676 };

export default function Dashboard() {
  const { user } = useAuth();
  const { requests } = useBooking();
  const { subscription, ledger } = useVendor();
  const { formatMoney } = useApp();

  const gateOk = user?.kycStatus === 'approved' && (subscription.state === 'active' || subscription.state === 'grace');
  const bannerTone = user?.kycStatus === 'rejected' || subscription.state === 'suspended' ? 'danger' : !gateOk ? 'warning' : 'success';
  const bannerText = gateOk
    ? 'Publishing is open — your listings can go live.'
    : user?.kycStatus !== 'approved'
      ? `Identity verification is ${user?.kycStatus || 'not started'} — publishing is blocked until it's approved.`
      : `Your subscription is ${subscription.state || 'not started'} — publishing is blocked.`;

  const awaiting = requests.filter((r) => r.status === 'pending').length;
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
          <span className="font-mono text-2xl font-semibold">{DEMO_KPIS.confirmedThisMonth}</span>
          <span className="text-xs text-fg-muted">Confirmed this month</span>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <span className="font-mono text-2xl font-semibold">{DEMO_KPIS.acceptanceRatePct}%</span>
          <span className="text-xs text-fg-muted">Acceptance rate</span>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <span className="font-mono text-2xl font-semibold">{formatMoney(DEMO_KPIS.netEarnedMonth)}</span>
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
