// C-14 chart shell (CLAUDE.md design system §2) — max 2 series, no pie
// charts, no dual axes. `data` is `[{ label, value, value2? }]`; `value2`
// (optional) renders as a second bar alongside the first, sharing one axis.
export default function BarChart({ data, seriesLabel, series2Label, height = 120, formatValue = (v) => v }) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.value, d.value2 || 0)));
  const barsHeight = height - 36;

  return (
    <div className="flex flex-col gap-3">
      {(seriesLabel || series2Label) && (
        <div className="flex items-center gap-3 text-[11px] text-fg-muted">
          {seriesLabel && (
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-primary" />
              {seriesLabel}
            </span>
          )}
          {series2Label && (
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-accent" />
              {series2Label}
            </span>
          )}
        </div>
      )}
      <div className="flex items-end gap-3" style={{ height }}>
        {data.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="font-mono text-[11px] text-fg-muted">{formatValue(d.value)}</span>
            <div className="flex w-full items-end justify-center gap-1" style={{ height: barsHeight }}>
              <div className="w-full max-w-[18px] rounded-t-md bg-primary" style={{ height: `${Math.max(4, (d.value / max) * barsHeight)}px` }} />
              {d.value2 !== undefined && (
                <div className="w-full max-w-[18px] rounded-t-md bg-accent" style={{ height: `${Math.max(4, (d.value2 / max) * barsHeight)}px` }} />
              )}
            </div>
            <span className="text-xs text-fg-subtle">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
