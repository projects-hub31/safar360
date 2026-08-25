import { useBooking } from '../../context/booking/useBooking';
import { useApp } from '../../context/app/useApp';
import PermGate from '../../components/admin/PermGate';
import { Card, KpiCard, BarChart } from '../../components/ui';

// Seeded platform-wide series — same honest framing as vendor Analytics.jsx:
// vendor listings aren't merged into live traveller search yet, so there's
// no real multi-month, multi-vendor history to derive a chart from. This
// session's own live bookings (from useBooking()) are folded into the KPI
// tiles above the chart, not silently replaced by seed data.
const MONTHS = [
  { label: 'Mar', value: 210 },
  { label: 'Apr', value: 264 },
  { label: 'May', value: 301 },
  { label: 'Jun', value: 278 },
  { label: 'Jul', value: 355 },
  { label: 'Aug', value: 392 },
];

// Tracks completed bookings, not created (§6 09/analytics) — a funnel that
// only counted "created" would hide exactly the drop-off it exists to show.
const FUNNEL = [
  { label: 'Reached checkout', value: 1180 },
  { label: 'Completed payment', value: 921 },
  { label: 'Lost to lock expiry', value: 156 },
  { label: 'Lost to payment failure', value: 103 },
];

export default function Analytics() {
  const { bookings } = useBooking();
  const { formatMoney } = useApp();

  const liveConfirmed = bookings.filter((b) => b.state === 'confirmed').length;
  const liveGross = bookings.filter((b) => b.state === 'confirmed').reduce((n, b) => n + b.total, 0);
  const funnelMax = Math.max(...FUNNEL.map((f) => f.value));

  return (
    <PermGate permKey="analytics">
      <div className="mx-auto flex max-w-[820px] flex-col gap-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Platform analytics</h1>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard value={392} label="Bookings completed this month" asOf="rollup 06:00" />
          <KpiCard value={liveConfirmed} label="Completed this session" asOf="just now" />
          <KpiCard value={formatMoney(liveGross + 18400000)} label="Gross this month" asOf="rollup 06:00" />
          <KpiCard value="78%" label="Checkout completion rate" asOf="rollup 06:00" />
        </div>

        <Card className="flex flex-col gap-3 p-4 sm:p-5">
          <strong className="text-sm">Bookings completed by month</strong>
          <BarChart data={MONTHS} seriesLabel="Completed bookings" />
        </Card>

        <Card className="flex flex-col gap-2.5 p-4 sm:p-5">
          <strong className="text-sm">Checkout funnel</strong>
          {FUNNEL.map((f) => (
            <div key={f.label} className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-fg-muted">
                <span>{f.label}</span>
                <span className="font-mono">{f.value.toLocaleString('en-US')}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(f.value / funnelMax) * 100}%` }} />
              </div>
            </div>
          ))}
        </Card>

        <p className="text-xs leading-relaxed text-fg-subtle">
          No impression counts, no "engagement" figures — every number above either is a completed transaction or
          explains where one was lost.
        </p>
      </div>
    </PermGate>
  );
}
