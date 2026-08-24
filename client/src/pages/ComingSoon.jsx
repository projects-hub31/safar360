import { Link, useLocation } from 'react-router-dom';

export default function ComingSoon() {
  const { pathname } = useLocation();

  return (
    <div className="flex flex-col items-start gap-3 rounded-card border border-border bg-surface p-6 sm:p-10">
      <span
        className="rounded-md border px-2 py-1 font-mono text-xs font-semibold"
        style={{ background: 'var(--danger-soft)', borderColor: 'var(--danger)', color: 'var(--danger-text)' }}
      >
        Not built yet
      </span>
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Nothing is registered at this address</h1>
      <p className="max-w-[60ch] text-sm leading-relaxed text-fg-muted">
        <span className="font-mono" dir="ltr">{pathname}</span> is outside the traveller discovery module built so far.
        Only Home, Search, Tour detail and Property detail are wired.
      </p>
      <Link
        to="/discover/home"
        className="mt-2 inline-flex min-h-[44px] items-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-on no-underline"
      >
        Back to Discover
      </Link>
    </div>
  );
}
