import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { useApp } from '../../context/app/useApp';
import { useAuth } from '../../context/auth/useAuth';
import { useShop } from '../../context/shop/useShop';
import { useAdmin } from '../../context/admin/useAdmin';
import { ROLES } from '../../context/auth/auth-context';
import { ADMIN_ROLES, perms } from '../../context/admin/admin-context';
import Button from '../ui/Button';

const ADMIN_ROLE_LABELS = { super: 'Super admin', sub: 'Sub admin (queues only)', finance: 'Finance admin' };

function navLinkClasses({ isActive }) {
  return [
    'rounded-t-md rounded-b-none px-2.5 py-2 text-sm no-underline border-b-[3px]',
    isActive
      ? 'font-bold text-fg border-accent'
      : 'font-medium text-fg-muted border-transparent hover:text-fg',
  ].join(' ');
}

// Shared shell for every role, not just the traveller — nav, role switcher,
// currency/theme toggles, cart. Named AppShell (not TravelerLayout) because
// operator/transport/property/seller/influencer/admin all mount through it too.
export default function AppShell() {
  const { theme, toggleTheme, currency, setCurrency } = useApp();
  const { user, signOut, switchRole } = useAuth();
  const { cart } = useShop();
  const { adminRole, setAdminRole } = useAdmin();
  const navigate = useNavigate();
  const cartCount = cart.reduce((n, l) => n + l.qty, 0);

  // Nav is role-aware (§5 per-role default nav) — a signed-out visitor and a
  // traveller both get the traveller nav, since that's the only role with a
  // public, no-account surface.
  const activeRole = ROLES.find((r) => r.id === user?.role) || ROLES[0];

  // Admin RBAC is enforced by absence (§3) — a nav item a sub/finance admin
  // can't use simply isn't rendered, never a disabled/greyed one (that would
  // advertise a capability they don't have). "Overview" always shows: every
  // admin role passes perms().analytics.
  const NAV_PERM_KEY = { KYC: 'kyc', Moderation: 'moderation', Finance: 'finance', Disputes: 'disputes', Config: 'config' };
  const adminPerms = perms(adminRole);
  const visibleNav = activeRole.id === 'admin'
    ? activeRole.nav.filter(([label]) => !(label in NAV_PERM_KEY) || adminPerms[NAV_PERM_KEY[label]])
    : activeRole.nav;

  const onSignOut = () => {
    signOut();
    navigate('/discover/home');
  };

  const onSwitchRole = (roleId) => {
    switchRole(roleId);
    const role = ROLES.find((r) => r.id === roleId);
    navigate(role.nav[0][1]);
  };

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
          <NavLink to={activeRole.nav[0][1]} className="flex flex-none items-center gap-2.5 text-fg no-underline">
            <Logo />
          </NavLink>

          <nav aria-label="Primary" className="flex min-w-0 flex-wrap gap-0.5">
            {visibleNav.map(([label, to]) => (
              <NavLink key={label} to={to} className={navLinkClasses}>
                {label}
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
            {activeRole.id === 'traveller' && (
              <>
                <NavLink
                  to="/shop/cart"
                  aria-label="Cart"
                  className="relative inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-border-strong bg-raised px-2.5 text-xs font-semibold text-fg no-underline"
                >
                  Cart
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 font-mono text-[11px] font-bold text-primary-on">
                    {cartCount}
                  </span>
                </NavLink>
                <NavLink
                  to="/discover/wishlist"
                  aria-label="Wishlist"
                  className="inline-flex min-h-[34px] min-w-[34px] items-center justify-center rounded-lg border border-border-strong bg-raised text-sm text-fg no-underline"
                >
                  ☆
                </NavLink>
              </>
            )}
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
            <NavLink
              to="/discover/profile"
              aria-label="Preferences"
              className="inline-flex min-h-[34px] min-w-[34px] items-center justify-center rounded-lg border border-border-strong bg-raised text-xs font-bold text-fg no-underline"
            >
              👤
            </NavLink>
            {user ? (
              <div className="flex items-center gap-1.5">
                <label className="hidden items-center gap-1.5 text-xs text-fg-muted sm:flex">
                  <span className="font-mono text-[10px] uppercase tracking-wider">Acting as</span>
                  <select
                    value={activeRole.id}
                    onChange={(e) => onSwitchRole(e.target.value)}
                    aria-label="Switch role"
                    className="min-h-[34px] cursor-pointer rounded-lg border border-border-strong bg-raised px-2 text-xs font-semibold text-fg"
                  >
                    {ROLES.map((r) => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </select>
                </label>
                {activeRole.id === 'admin' && (
                  <label className="hidden items-center gap-1.5 text-xs text-fg-muted md:flex">
                    <span className="font-mono text-[10px] uppercase tracking-wider">Sub-role</span>
                    <select
                      value={adminRole}
                      onChange={(e) => setAdminRole(e.target.value)}
                      aria-label="Switch admin sub-role"
                      className="min-h-[34px] cursor-pointer rounded-lg border border-border-strong bg-raised px-2 text-xs font-semibold text-fg"
                    >
                      {ADMIN_ROLES.map((r) => (
                        <option key={r} value={r}>{ADMIN_ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  </label>
                )}
                <span className="hidden text-xs font-semibold text-fg-muted sm:inline">Hi, {user.name.split(' ')[0]}</span>
                <Button variant="secondary" size="sm" onClick={onSignOut}>
                  Sign out
                </Button>
              </div>
            ) : (
              <Button to="/identity/login" size="sm">
                Sign in
              </Button>
            )}
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-[1440px] px-3 py-5 sm:px-6 sm:py-7">
        <Outlet />
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-[1440px] px-3 py-6 text-xs uppercase tracking-wider text-fg-subtle sm:px-6 font-mono">
          safar360 · one demo account, every actor — switch roles above
        </div>
      </footer>
    </div>
  );
}
