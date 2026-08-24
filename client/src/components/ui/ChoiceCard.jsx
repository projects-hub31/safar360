// Single-select radio-style card — payment methods, cancellation reasons,
// subscription plans. Extracted after the third hand-rolled copy of this
// same shape; use this instead of a fourth.
export default function ChoiceCard({ active, onClick, title, subtitle, meta, disabled, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-start ${
        disabled
          ? 'cursor-not-allowed border-border bg-sunken opacity-60'
          : active
            ? 'border-2 border-primary bg-primary-soft'
            : 'border-border-strong bg-surface'
      } ${className}`}
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="font-display text-base font-semibold">{title}</span>
        {subtitle && <span className="text-xs leading-relaxed text-fg-muted">{subtitle}</span>}
      </span>
      {meta && <span className="flex-none font-mono text-sm font-semibold">{meta}</span>}
    </button>
  );
}
