import { Link } from 'react-router-dom';
import { useSocial } from '../../context/social/useSocial';
import { useApp } from '../../context/app/useApp';
import { AUTHORS, DEMO_INFLUENCER_ID, INFLUENCER_PLATFORM_FEE_PCT } from '../../context/social/social-context';
import { DataTable, StatusPill, KpiCard } from '../../components/ui';

// Hue choices here aren't a spec-mandated table the way the ledger/audit
// tones are — invited/accepted/in_progress read as "in motion or awaiting
// someone" (info/warning), paid is the one terminal-good state (success),
// declined never held any money (neutral/archived), cancelled broke an
// accepted commitment (danger).
const TONE = { invited: 'warning', accepted: 'info', in_progress: 'info', delivered: 'warning', paid: 'success', declined: 'neutral', cancelled: 'danger' };
const LABEL = { invited: 'Invited', accepted: 'Accepted', in_progress: 'In progress', delivered: 'Delivered', paid: 'Paid', declined: 'Declined', cancelled: 'Cancelled' };

export default function Campaigns() {
  const { collabs } = useSocial();
  const { formatMoney } = useApp();
  const me = AUTHORS[DEMO_INFLUENCER_ID];

  const mine = collabs; // single demo account — every seeded collab already belongs to `me`

  const invitedCount = mine.filter((c) => c.status === 'invited').length;
  const earned = mine.filter((c) => c.status === 'delivered' || c.status === 'paid').reduce((n, c) => n + c.escrowAmount, 0);
  const paidNet = mine.filter((c) => c.status === 'paid')
    .reduce((n, c) => n + (c.escrowAmount - Math.round(c.escrowAmount * (INFLUENCER_PLATFORM_FEE_PCT / 100))), 0);

  const columns = [
    { key: 'operator', label: 'Operator', render: (c) => <span className="text-sm font-semibold">{AUTHORS[c.operatorId]?.name || c.operatorId}</span> },
    { key: 'tour', label: 'Tour', render: (c) => <span className="text-sm">{c.tourTitle}</span> },
    {
      key: 'deliverables',
      label: 'Deliverables',
      render: (c) => {
        const done = c.deliverables.filter((d) => d.verified && d.disclosed).length;
        return <span className="font-mono text-xs text-fg-muted">{done}/{c.deliverables.length} verified</span>;
      },
    },
    { key: 'escrow', label: 'Escrow', render: (c) => <span className="font-mono text-sm">{formatMoney(c.escrowAmount)}</span> },
    { key: 'status', label: 'Status', render: (c) => <StatusPill tone={TONE[c.status]}>{LABEL[c.status]}</StatusPill> },
  ];

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Campaigns</h1>
        <p className="text-xs text-fg-subtle">Collaborations for {me.name}. Payment is escrowed once you accept, released once every deliverable is verified and disclosed.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard value={formatMoney(earned)} label="Earned — verified deliverables" tone="neutral" />
        <KpiCard value={formatMoney(paidNet)} label={`Paid — net of ${INFLUENCER_PLATFORM_FEE_PCT}% platform fee`} tone="success" />
        <KpiCard value={String(invitedCount)} label="Needs your response" tone={invitedCount > 0 ? 'warning' : 'neutral'} />
      </div>

      <DataTable
        columns={columns}
        rows={mine}
        rowKey={(c) => c.id}
        renderActions={(c) => (
          <Link to={`/social/collab/${c.id}`} className="text-xs font-semibold text-primary no-underline hover:underline">View →</Link>
        )}
        emptyTitle="No collaborations yet"
        emptyBody="An operator invitation will appear here."
      />
    </div>
  );
}
