import { NavLink, Outlet } from 'react-router-dom';
import Logo from './Logo';
import { useApp } from '../context/useApp';

const NAV = [
  { label: 'Discover', to: '/discover/home', match: '/discover' },
  { label: 'Bookings', to: '/booking/history' },
  { label: 'Trips', to: '/ai/planner' },
  { label: 'Feed', to: '/social/feed' },
  { label: 'Gear', to: '/shop/catalog' },
];

function navLinkClasses({ isActive }) {
  return [
    'rounded-t-md rounded-b-none px-2.5 py-2 text-sm no-underline border-b-[3px]',
    isActive
      ? 'font-bold text-fg border-accent'
      : 'font-medium text-fg-muted border-transparent hover:text-fg',
  ].join(' ');
}

export default function TravelerLayout() {
  const { theme, toggleTheme, currency, setCurrency } = useApp();

  return (
    <div className="min-h-screen bg-bg">
      <a
        href="#main"
        className="absolute -left-[9999px] top-2 z-[99] rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm font-semibold focus:left-2"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-border bg-surface shadow-sh1">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-3 px-3 py-2.5 sm:gap-5 sm:px-6">
          <NavLink to="/discover/home" className="flex flex-none items-center gap-2.5 text-fg no-underline">
            <Logo />
          </NavLink>

          <nav aria-label="Primary" className="flex min-w-0 flex-wrap gap-0.5">
            {NAV.map((item) => (
              <NavLink key={item.label} to={item.to} className={navLinkClasses}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex flex-wrap items-center gap-1.5 sm:gap-2">
            <label className="flex items-center gap-1.5 text-xs text-fg-muted">
              <span className="font-mono text-[10px] uppercase tracking-wider">Cur</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                aria-label="Currency"
                className="min-h-[34px] cursor-pointer rounded-lg border border-border-strong bg-raised px-2 font-mono text-xs font-semibold text-fg"
              >
                <option value="PKR">PKR</option>
                <option value="USD">USD</option>
                <option value="AED">AED</option>
              </select>
            </label>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Switch theme"
              className="min-h-[34px] cursor-pointer rounded-lg border border-border-strong bg-raised px-2.5 font-ui text-xs font-semibold text-fg"
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
            <NavLink
              to="/shop/cart"
              aria-label="Cart"
              className="relative inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-border-strong bg-raised px-2.5 text-xs font-semibold text-fg no-underline"
            >
              Cart
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 font-mono text-[11px] font-bold text-primary-on">
                0
              </span>
            </NavLink>
            <button
              type="button"
              aria-label="Alerts"
              className="relative inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-border-strong bg-raised px-2.5 font-ui text-xs font-semibold text-fg"
            >
              Alerts
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 font-mono text-[11px] font-bold text-ink-900">
                2
              </span>
            </button>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-[1440px] px-3 py-5 sm:px-6 sm:py-7">
        <Outlet />
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-[1440px] px-3 py-6 text-xs uppercase tracking-wider text-fg-subtle sm:px-6 font-mono">
          safar360 · traveller discovery
        </div>
      </footer>
    </div>
  );
}
