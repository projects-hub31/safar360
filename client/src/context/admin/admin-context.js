import { createContext } from 'react';

export const AdminContext = createContext(null);

export {
  KYC_REJECT_REASONS, KYC_QUEUE, PLATFORM_LEDGER_EXTRA, POLICY_FIELDS,
} from '../../data/admin/admin';

export const ADMIN_ROLES = ['super', 'sub', 'finance'];

// Exact permission matrix (CLAUDE.md §3 "Admin RBAC"). Enforced by absence —
// a denied nav item or screen simply doesn't render, never greyed-out (that
// would advertise a capability a sub-admin can't use).
export function perms(adminRole) {
  return {
    kyc: adminRole === 'super' || adminRole === 'sub',
    moderation: adminRole === 'super' || adminRole === 'sub',
    finance: adminRole === 'super' || adminRole === 'finance',
    disputes: adminRole === 'super' || adminRole === 'finance',
    fraud: adminRole === 'super' || adminRole === 'finance',
    analytics: true,
    config: adminRole === 'super',
    audit: adminRole === 'super' || adminRole === 'finance',
  };
}

export const AUDIT_FILTERS = [
  { id: 'all', label: 'Everything' },
  { id: 'refused', label: 'Refused' },
  { id: 'money', label: 'Money' },
  { id: 'moderation', label: 'Moderation' },
];
