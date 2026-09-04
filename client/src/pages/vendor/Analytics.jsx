import { useEffect } from 'react';
import { useVendor } from '../../context/vendor/useVendor';
import { useApp } from '../../context/app/useApp';
import Card from '../../components/ui/Card';

// Traffic-source breakdown stays illustrative — there's no referral/campaign
// click-tracking backend yet (that lands with the future referral module),
// so this endpoint can't honestly back real numbers here. Everything else on
// this screen (KPIs, bookings-by-month) is real — GET /api/vendor/analytics.
const SOURCES = [
  { label: 'Search & discovery', pct: 54 },
  { label: 'Direct link / repeat traveller', pct: 21 },
  { label: 'Referral (traveller invite)', pct: 15 },
  { label: 'Social / influencer post', pct: 10 },
];

export default function Analytics() {
  const { analytics, fetchAnalytics } = useVendor();
  const { formatMoney } = useApp();

  useEffect(() => {
    fetchAnalytics();
    // Runs once on mount — fetchAnalytics is stable (useCallback, no deps).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const months = analytics?.monthly || [];
  const max = Math.max(1, ...months.map((m) => m.bookings));

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Analytics</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="flex flex-col gap-1 p-4">
          <span className="font-mono text-2xl font-semibold">{analytics?.bookingsCount ?? '—'}</span>
          <span className="text-xs text-fg-muted">Confirmed bookings</span>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <span className="font-mono text-2xl font-semibold">{formatMoney(analytics?.netEarned ?? 0)}</span>
          <span className="text-xs text-fg-muted">Net earned</span>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <span className="font-mono text-2xl font-semibold">{analytics?.acceptanceRate != null ? `${analytics.acceptanceRate}%` : '—'}</span>
          <span className="text-xs text-fg-muted">Acceptance rate</span>
        </Card>
      </div>

      <Card className="flex flex-col gap-3 p-4 sm:p-5">
        <strong className="text-sm">Bookings by month</strong>
        <div className="flex items-end gap-3" style={{ height: 120 }}>
          {months.map((m) => (
            <div key={m.label} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-xs font-mono text-fg-muted">{m.bookings}</span>
              <div
                className="w-full rounded-t-md bg-primary"
                style={{ height: `${Math.max(6, (m.bookings / max) * 88)}px` }}
              />
              <span className="text-xs text-fg-subtle">{m.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-2.5 p-4 sm:p-5">
        <div className="flex items-baseline justify-between gap-2">
          <strong className="text-sm">Where bookings come from</strong>
          <span className="text-[11px] text-fg-subtle">Illustrative — no click/referral tracking yet</span>
        </div>
        {SOURCES.map((s) => (
          <div key={s.label} className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-fg-muted">
              <span>{s.label}</span>
              <span className="font-mono">{s.pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${s.pct}%` }} />
            </div>
          </div>
        ))}
      </Card>

      <p className="text-xs leading-relaxed text-fg-subtle">
        No view counts or profile-visit vanity metrics here on purpose — every number above either converts to
        a booking or explains where a booking came from. A number a vendor can't act on doesn't belong on this page.
      </p>
    </div>
  );
}
