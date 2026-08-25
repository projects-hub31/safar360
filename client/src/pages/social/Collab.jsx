import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSocial } from '../../context/social/useSocial';
import { useApp } from '../../context/app/useApp';
import { AUTHORS, INFLUENCER_PLATFORM_FEE_PCT } from '../../context/social/social-context';
import { Button, Card, StatusPill, Toggle, EmptyState } from '../../components/ui';

const TONE = { invited: 'warning', accepted: 'info', in_progress: 'info', delivered: 'warning', paid: 'success', declined: 'neutral', cancelled: 'danger' };
const LABEL = { invited: 'Invited', accepted: 'Accepted', in_progress: 'In progress', delivered: 'Delivered', paid: 'Paid', declined: 'Declined', cancelled: 'Cancelled' };

export default function Collab() {
  const { id } = useParams();
  const { collabs, acceptCollab, declineCollab, startCollab, cancelCollab, toggleDeliverable, markDelivered, markPaid } = useSocial();
  const { formatMoney } = useApp();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [error, setError] = useState('');

  const collab = collabs.find((c) => c.id === id);
  if (!collab) {
    return <EmptyState title="Collaboration not found" body="It may have been withdrawn." actionLabel="Back to campaigns" actionTo="/social/campaigns" />;
  }

  const operator = AUTHORS[collab.operatorId] || { name: collab.operatorId };
  const allVerified = collab.deliverables.every((d) => d.verified && d.disclosed);
  const missingCount = collab.deliverables.filter((d) => !(d.verified && d.disclosed)).length;
  const net = collab.escrowAmount - Math.round(collab.escrowAmount * (INFLUENCER_PLATFORM_FEE_PCT / 100));

  const act = (fn) => (...args) => {
    const res = fn(...args);
    setError(res?.ok === false ? res.error : '');
  };

  return (
    <div className="mx-auto flex max-w-[680px] flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{collab.tourTitle}</h1>
          <StatusPill tone={TONE[collab.status]}>{LABEL[collab.status]}</StatusPill>
        </div>
        <span className="text-sm text-fg-muted">with {operator.name} · <span dir="ltr" className="font-mono text-xs">{collab.tourRef}</span></span>
      </div>

      {error && (
        <Card className="border-danger p-3 text-sm text-danger-text">{error}</Card>
      )}

      <Card className="flex items-center justify-between p-4 sm:p-5">
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase tracking-wider text-fg-subtle">Escrow</span>
          <span className="text-[11px] text-fg-muted">Held since acceptance, released once every deliverable is verified and disclosed.</span>
        </div>
        <span className="font-mono text-xl font-semibold">{formatMoney(collab.escrowAmount)}</span>
      </Card>

      {collab.status === 'invited' && (
        <Card className="flex flex-col gap-3 p-4 sm:p-5">
          <span className="text-sm text-fg-muted">{operator.name} invited you to this collaboration. Accepting escrows the payment; declining creates no obligation on either side.</span>
          <div className="flex gap-2">
            <Button onClick={act(() => acceptCollab(collab.id))}>Accept — escrow {formatMoney(collab.escrowAmount)}</Button>
            <Button variant="secondary" onClick={act(() => declineCollab(collab.id))}>Decline</Button>
          </div>
        </Card>
      )}

      {collab.status !== 'invited' && collab.status !== 'declined' && (
        <Card className="flex flex-col gap-3 p-4 sm:p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-fg-subtle">Deliverables</span>
          {collab.deliverables.map((d) => (
            <div key={d.id} className="flex flex-col gap-1.5 border-b border-border pb-3 last:border-0 last:pb-0">
              <span className="text-sm">{d.label}</span>
              {collab.status === 'in_progress' ? (
                <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-6">
                  <Toggle label="Verified" checked={d.verified} onChange={() => toggleDeliverable(collab.id, d.id, 'verified')} />
                  <Toggle label="Disclosed" checked={d.disclosed} onChange={() => toggleDeliverable(collab.id, d.id, 'disclosed')} />
                </div>
              ) : (
                <div className="flex gap-2">
                  <StatusPill tone={d.verified ? 'success' : 'neutral'}>{d.verified ? 'Verified' : 'Not yet verified'}</StatusPill>
                  <StatusPill tone={d.disclosed ? 'success' : 'neutral'}>{d.disclosed ? 'Disclosed' : 'Not yet disclosed'}</StatusPill>
                </div>
              )}
            </div>
          ))}
        </Card>
      )}

      {collab.status === 'accepted' && (
        <Card className="flex flex-col gap-3 p-4 sm:p-5">
          <Button onClick={act(() => startCollab(collab.id))}>Start work</Button>
          {!confirmingCancel ? (
            <Button variant="tertiary" size="sm" className="w-fit" onClick={() => setConfirmingCancel(true)}>Cancel this collaboration</Button>
          ) : (
            <div className="flex flex-col gap-2 rounded-xl border border-danger bg-danger-soft p-3">
              <span className="text-xs leading-relaxed text-danger-text">
                A real cancellation here takes effect 7 days out with notice to {operator.name}, per policy — this
                demo applies it immediately. The {formatMoney(collab.escrowAmount)} escrow is released, unearned.
              </span>
              <div className="flex gap-2">
                <Button variant="destructive" size="sm" onClick={act(() => { setConfirmingCancel(false); return cancelCollab(collab.id); })}>
                  Cancel and release {formatMoney(collab.escrowAmount)} escrow
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setConfirmingCancel(false)}>Never mind</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {collab.status === 'in_progress' && (
        <Card className="flex flex-col gap-2 p-4 sm:p-5">
          <Button onClick={act(() => markDelivered(collab.id))} disabled={!allVerified}>Mark delivered</Button>
          {!allVerified && (
            <span className="text-xs text-fg-subtle">Verify and disclose all {collab.deliverables.length} deliverables to mark this delivered — {missingCount} left.</span>
          )}
        </Card>
      )}

      {collab.status === 'delivered' && (
        <Card className="flex flex-col gap-2 p-4 sm:p-5">
          <span className="text-sm text-fg-muted">All deliverables verified and disclosed. Payment release is next.</span>
          <Button onClick={act(() => markPaid(collab.id))}>Mark paid (demo)</Button>
        </Card>
      )}

      {collab.status === 'paid' && (
        <Card className="flex flex-col gap-2 p-4 sm:p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-fg-subtle">Earned vs. paid</span>
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
            <span className="flex flex-col">
              <span className="font-mono text-lg font-semibold">{formatMoney(collab.escrowAmount)}</span>
              <span className="text-[11px] text-fg-muted">Earned</span>
            </span>
            <span className="flex flex-col">
              <span className="font-mono text-lg font-semibold text-fg-muted">− {formatMoney(collab.escrowAmount - net)}</span>
              <span className="text-[11px] text-fg-muted">{INFLUENCER_PLATFORM_FEE_PCT}% platform fee withheld</span>
            </span>
            <span className="flex flex-col">
              <span className="font-mono text-lg font-semibold text-success-text">{formatMoney(net)}</span>
              <span className="text-[11px] text-fg-muted">Paid to your account</span>
            </span>
          </div>
        </Card>
      )}

      {collab.status === 'cancelled' && (
        <Card className="p-4 text-sm text-fg-muted sm:p-5">This collaboration was cancelled. No further deliverables are owed and the escrow was released, unearned.</Card>
      )}
      {collab.status === 'declined' && (
        <Card className="p-4 text-sm text-fg-muted sm:p-5">You declined this invitation. No obligation was created on either side.</Card>
      )}
    </div>
  );
}
