import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/auth/useAuth';
import { ROLES } from '../../context/auth/auth-context';
import EmptyState from '../ui/EmptyState';

// Only ever mounted under RequireAuth (see App.jsx), so `user` is always
// present here. Single-demo-account role-switcher (§7) means "wrong role"
// really means "switch the header's Acting-as picker," not a real
// authorization failure — the gate copy says exactly that, same spirit as
// PermGate's admin sub-role message.
export default function RequireRole({ role }) {
  const { user } = useAuth();
  const allowed = Array.isArray(role) ? role : [role];

  if (!allowed.includes(user.role)) {
    const home = ROLES.find((r) => r.id === user.role) || ROLES[0];
    return (
      <EmptyState
        title="Not available for this role"
        body={`You're acting as "${home.label}" — switch "Acting as" in the header to access this page.`}
        actionLabel={`Back to ${home.label}`}
        actionTo={home.nav[0][1]}
      />
    );
  }

  return <Outlet />;
}
