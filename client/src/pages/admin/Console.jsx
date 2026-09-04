import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../../context/admin/useAdmin';
import { useSocial } from '../../context/social/useSocial';
import { useApp } from '../../context/app/useApp';
import { perms } from '../../context/admin/admin-context';
import { Card, KpiCard, StatusPill } from '../../components/ui';

const TILES = [
  { to: '/admin/kyc', key: 'kyc', label: 'KYC queue' },
  { to: '/admin/moderation', key: 'moderation', label: 'Moderation' },
  { to: '/admin/ledger', key: 'finance', label: 'Ledger' },
  { to: '/admin/payout-batch', key: 'finance', label: 'Payout batches' },
  { to: '/admin/disputes', key: 'disputes', label: 'Disputes' },
  { to: '/admin/fraud', key: 'fraud', label: 'Fraud review' },
  { to: '/admin/analytics', key: 'analytics', label: 'Analytics' },
  { to: '/admin/config', key: 'config', label: 'Policy config' },
  { to: '/admin/audit', key: 'audit', label: 'Audit log' },
];

export default function Console() {
  const { adminRole, policy, kycQueue, fetchKycQueue, fraudQueue, fetchFraud, disputes, fetchDisputes, ledger, fetchLedger } = useAdmin();
  const { posts } = useSocial();
  const { formatMoney } = useApp();
  const p = perms(adminRole);

  useEffect(() => {
    if (p.kyc) fetchKycQueue();
    if (p.fraud) fetchFraud();
    if (p.disputes) fetchDisputes();
    if (p.finance) fetchLedger();
    // Runs once on mount and whenever the acting sub-role changes what's visible.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminRole]);

  const pendingKyc = kycQueue.filter((r) => r.status === 'pending').length;
  const underReview = posts.filter((post) => post.moderation === 'under_review').length;
  const held = fraudQueue.filter((r) => r.status === 'held' || r.status === 'ask-id').length;
  const openDisputes = disputes.filter((d) => d.status === 'open').length;
  const pendingNet = ledger.filter((r) => r.state === 'pending').reduce((n, r) => n + r.net, 0);
  const heldDisputeCount = policy ? fraudQueue.filter((r) => r.score >= policy.fraudThreshold && r.status === 'held').length : 0;

  // KPI and module tiles both filtered live through perms() (§3 admin/console)
  // — a denied area is absent here, not disabled.
  const visibleTiles = TILES.filter((t) => p[t.key]);

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Admin overview</h1>
        <StatusPill tone="info">Signed in as {adminRole}</StatusPill>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {p.kyc && <KpiCard value={pendingKyc} label="KYC awaiting review" tone={pendingKyc > 0 ? 'warning' : 'neutral'} asOf="just now" />}
        {p.moderation && <KpiCard value={underReview} label="Content under review" tone={underReview > 0 ? 'warning' : 'neutral'} asOf="just now" />}
        {p.finance && <KpiCard value={formatMoney(pendingNet)} label="Pending payout" asOf="just now" />}
        {p.fraud && <KpiCard value={held} label="Payments held for fraud review" tone={held > 0 ? 'danger' : 'neutral'} asOf="just now" />}
        {p.disputes && <KpiCard value={openDisputes} label="Open disputes" tone={openDisputes > 0 ? 'warning' : 'neutral'} asOf="just now" />}
        {p.fraud && <KpiCard value={heldDisputeCount} label="Above the live fraud threshold" asOf="just now" />}
      </div>

      <Card className="flex flex-col gap-2 p-4 sm:p-5">
        <strong className="text-sm">Queues and money</strong>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {visibleTiles.map((t) => (
            <Link key={t.to} to={t.to} className="rounded-xl border border-border-strong bg-raised px-4 py-3 text-sm font-semibold text-fg no-underline hover:bg-sunken">
              {t.label}
            </Link>
          ))}
        </div>
      </Card>

      <p className="text-xs leading-relaxed text-fg-subtle">
        Nothing above is greyed out — a tile or number your role can't see simply isn't rendered. Switch "Sub-role" in
        the header to see the exact same screen change shape for `sub` and `finance`.
      </p>
    </div>
  );
}
