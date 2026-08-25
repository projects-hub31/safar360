import Card from './Card';

// C-14 KPI card (CLAUDE.md design system §2) — every figure states "as of
// [rollup time]" so a stale number never reads as live.
export default function KpiCard({ value, label, asOf, tone = 'neutral' }) {
  const valueTone = { neutral: 'text-fg', success: 'text-success-text', warning: 'text-warning-text', danger: 'text-danger-text' }[tone];
  return (
    <Card className="flex flex-col gap-1 p-4">
      <span className={`font-mono text-2xl font-semibold ${valueTone}`}>{value}</span>
      <span className="text-xs text-fg-muted">{label}</span>
      {asOf && <span className="text-[10px] font-mono uppercase tracking-wider text-fg-subtle">As of {asOf}</span>}
    </Card>
  );
}
