import { Link } from 'react-router-dom';

// C-01 Button (see CLAUDE.md design system §2). Exactly one primary per view —
// on money screens, that one is the payment action.
const VARIANTS = {
  primary: 'bg-primary text-primary-on hover:bg-primary-hover active:bg-primary-press',
  secondary: 'border border-border-loud bg-surface text-fg hover:bg-sunken',
  tertiary: 'bg-transparent text-primary-soft-text hover:bg-primary-soft',
  destructive: 'bg-danger text-white hover:bg-danger-hover',
};

const SIZES = {
  lg: 'min-h-[52px] rounded-lg px-6 text-base font-bold',
  md: 'min-h-[44px] rounded-lg px-4 text-[15px] font-bold',
  sm: 'min-h-9 rounded-lg px-3 text-[13px] font-semibold',
};

const DISABLED_CLASSES = 'pointer-events-none cursor-not-allowed border border-border bg-sunken text-fg-subtle';

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="h-[15px] w-[15px] flex-none animate-spin rounded-full border-2 border-current border-t-transparent opacity-70"
    />
  );
}

/**
 * Renders a <Link> when `to` is given (and not disabled), otherwise a <button>.
 * Disabled state never removes the control — pair it with a caption elsewhere
 * naming the blocker (design system Law 4: blocks explain themselves).
 */
export default function Button({
  to,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  children,
  ...props
}) {
  const isDisabled = disabled || loading;
  const classes = [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap text-center no-underline transition-colors duration-[80ms] leading-none',
    SIZES[size],
    isDisabled ? DISABLED_CLASSES : VARIANTS[variant],
    fullWidth ? 'w-full' : '',
    className,
  ].join(' ');

  const content = (
    <>
      {loading && <Spinner />}
      {children}
    </>
  );

  if (to && !isDisabled) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} disabled={isDisabled} aria-busy={loading || undefined} {...props}>
      {content}
    </button>
  );
}
