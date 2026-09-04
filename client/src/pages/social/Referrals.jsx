import { useApp } from '../../context/app/useApp';
import { useAdmin } from '../../context/admin/useAdmin';
import { AUTHORS, DEMO_INFLUENCER_ID, INFLUENCER_PLATFORM_FEE_PCT } from '../../context/social/social-context';
import { PLATFORM_LEDGER_EXTRA } from '../../context/admin/admin-context';
import { DataTable, StatusPill, Card } from '../../components/ui';

const TONE = { accruing: 'neutral', accrued: 'info', pending: 'warning', released: 'success', 'held·dispute': 'held', reversed: 'danger' };

// Same shared ledger rows the admin Ledger screen reads (CLAUDE.md §6:
// "Conversions list is the same shared ledger rows, filtered to
// kind==='referral', that the admin ledger screen shows — one source of
// truth so the two surfaces can never disagree") — imported straight from
// PLATFORM_LEDGER_EXTRA rather than a second, separate seed array.
export default function Referrals() {
  const { formatMoney } = useApp();
  const { policy } = useAdmin();
  const me = AUTHORS[DEMO_INFLUENCER_ID];

  const rows = PLATFORM_LEDGER_EXTRA.filter((r) => r.kind === 'referral' && r.party === me.name);
  const notYetReleased = rows.filter((r) => r.state !== 'released');
  const released = rows.filter((r) => r.state === 'released');

  const earnedGross = notYetReleased.reduce((n, r) => n + r.net, 0);
  const withheld = Math.round(earnedGross * (INFLUENCER_PLATFORM_FEE_PCT / 100));
  const earnedNet = earnedGross - withheld;

  const paidGross = released.reduce((n, r) => n + r.net, 0);
  const paidNet = paidGross - Math.round(paidGross * (INFLUENCER_PLATFORM_FEE_PCT / 100));

  const columns = [
    { key: 'ref', label: 'Reference', render: (r) => <span dir="ltr" className="font-mono text-xs">{r.ref}</span> },
    { key: 'label', label: 'Booking', render: (r) => <span className="text-sm">{r.label}</span> },
    { key: 'gross', label: 'Booking total', render: (r) => <span className="font-mono text-xs text-fg-muted">{formatMoney(r.gross)}</span> },
    { key: 'rate', label: 'Rate', render: (r) => <span className="font-mono text-xs">{Math.round(r.rate * 100)}%</span> },
    { key: 'commission', label: 'Your commission', render: (r) => <span className="font-mono text-sm font-semibold">{formatMoney(r.commission)}</span> },
    { key: 'state', label: 'State', render: (r) => <StatusPill tone={TONE[r.state]}>{r.state}</StatusPill> },
  ];

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Referrals</h1>
      <p className="text-xs leading-relaxed text-fg-subtle">
        Last-click attribution, a {policy?.attributionDays ?? 30}-day window. Conversions only count once a booking is
        actually captured — a failed payment leaves no commission behind. Paid on trip completion, not on booking.
      </p>

      <Card className="flex flex-col gap-2 p-4 sm:p-5">
        <span className="text-xs font-bold uppercase tracking-wider text-fg-subtle">Earned, not yet paid</span>
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
          <span className="flex flex-col">
            <span className="font-mono text-lg font-semibold">{formatMoney(earnedGross)}</span>
            <span className="text-[11px] text-fg-muted">Gross</span>
          </span>
          <span className="flex flex-col">
            <span className="font-mono text-lg font-semibold text-fg-muted">− {formatMoney(withheld)}</span>
            <span className="text-[11px] text-fg-muted">{INFLUENCER_PLATFORM_FEE_PCT}% platform fee withheld</span>
          </span>
          <span className="flex flex-col">
            <span className="font-mono text-lg font-semibold text-success-text">{formatMoney(earnedNet)}</span>
            <span className="text-[11px] text-fg-muted">What reaches your account</span>
          </span>
        </div>
      </Card>

      <Card className="flex items-center justify-between gap-3 p-4 sm:p-5">
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase tracking-wider text-fg-subtle">Already paid</span>
          <span className="text-[11px] text-fg-muted">{released.length} referral{released.length === 1 ? '' : 's'} released, net of the platform fee</span>
        </div>
        <span className="font-mono text-lg font-semibold">{formatMoney(paidNet)}</span>
      </Card>

      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} emptyTitle="No referral conversions yet" emptyBody="Share your referral link — a booking captured within the attribution window credits you here." />
    </div>
  );
}
