import { useAdmin } from '../../context/admin/useAdmin';
import { perms } from '../../context/admin/admin-context';
import EmptyState from '../ui/EmptyState';

// Three-part gate template (§2 "Gates & permission-denied"): blocked · why ·
// what unblocks it. The primary RBAC enforcement is absence from the nav
// (AppShell) — this is the defense-in-depth screen-level check for anyone
// who lands on the URL directly, and it's also a direct demo of the pattern
// itself. `permKey` is one of perms()'s own keys (kyc/moderation/finance/
// disputes/fraud/config/audit).
export default function PermGate({ permKey, children }) {
  const { adminRole } = useAdmin();
  if (!perms(adminRole)[permKey]) {
    return (
      <EmptyState
        title="Not visible to this role"
        body={`A "${adminRole}" admin doesn't carry this permission. Switch "Sub-role" in the header to super — or whichever role owns this queue — to see it.`}
        actionLabel="Back to overview"
        actionTo="/admin/console"
      />
    );
  }
  return children;
}
