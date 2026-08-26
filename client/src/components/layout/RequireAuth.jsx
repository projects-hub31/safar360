import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/auth/useAuth';
import EmptyState from '../ui/EmptyState';

// Route guard — CLAUDE.md §8 flagged this as a known gap ("nothing stops a
// signed-out user from hitting /identity/kyc directly"). Follows the same
// three-part gate template PermGate already established for admin RBAC
// (blocked · why · what unblocks it) rather than a silent redirect, so a
// direct deep link explains itself instead of just bouncing to Discover.
// The UI gate is never the security control (§2) — there is no real backend
// behind any of this yet for the API to enforce, so this is purely an honest
// UX improvement, not a security boundary.
export default function RequireAuth() {
  const { user } = useAuth();

  if (!user) {
    return (
      <EmptyState
        title="Sign in to continue"
        body="This page needs an account. Sign in if you already have one, or register — it only takes a phone number and a code."
        actionLabel="Sign in"
        actionTo="/identity/login"
      />
    );
  }

  return <Outlet />;
}
