// C-06 Status pill (see CLAUDE.md design system §2). One pill per legal state —
// never two pills on one object, never colour without a glyph + label.
const TONE = {
  success: 'border-success bg-success-soft text-success-text',
  danger: 'border-danger bg-danger-soft text-danger-text',
  warning: 'border-warning bg-warning-soft text-warning-text',
  info: 'border-info bg-info-soft text-info-text',
  held: 'border-held bg-held-soft text-held-text',
  neutral: 'border-border-loud bg-sunken text-fg-muted',
  accent: 'border-transparent bg-accent text-ink-900',
};

export default function StatusPill({ tone = 'neutral', icon, children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-semibold ${TONE[tone]} ${className}`}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}
