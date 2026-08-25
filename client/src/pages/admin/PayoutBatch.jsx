import { useState } from 'react';
import { useAdmin } from '../../context/admin/useAdmin';
import { useApp } from '../../context/app/useApp';
import { ADMIN_ROSTER } from '../../context/admin/admin-context';
import PermGate from '../../components/admin/PermGate';
import { Card, Button, StatusPill, TextField } from '../../components/ui';

export default function PayoutBatch() {
  const { payoutCandidates, batch, prepareBatch, approveBatch, resetBatch } = useAdmin();
  const { formatMoney } = useApp();
  const [selected, setSelected] = useState(new Set());
  const [preparer, setPreparer] = useState('');
  const [approver, setApprover] = useState('');
  const [error, setError] = useState('');

  const toggle = (id) => setSelected((s) => {
    const next = new Set(s);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const onPrepare = () => {
    const res = prepareBatch([...selected], preparer);
    setError(res.ok ? '' : res.error);
  };

  const onApprove = () => {
    const res = approveBatch(approver);
    setError(res.ok ? '' : res.error);
  };

  const selectedTotal = payoutCandidates.filter((c) => selected.has(c.id)).reduce((n, c) => n + c.amount, 0);
  const batchTotal = payoutCandidates.filter((c) => batch.candidateIds.includes(c.id)).reduce((n, c) => n + c.amount, 0);

  return (
    <PermGate permKey="finance">
      <div className="mx-auto flex max-w-[720px] flex-col gap-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Payout batch</h1>
        <p className="text-xs leading-relaxed text-fg-subtle">
          Approval is two-step, enforced by identity — the person who prepared a batch can't also approve it, even if
          their role would otherwise allow both. A payee with an open dispute is held out of a batch entirely.
        </p>

        {batch.status === 'draft' && (
          <>
            <Card className="flex flex-col gap-2 p-4 sm:p-5">
              {payoutCandidates.map((c) => (
                <label
                  key={c.id}
                  className={`flex items-center justify-between gap-3 border-t border-border py-2 text-sm first:border-0 first:pt-0 ${c.hasOpenDispute ? 'opacity-60' : ''}`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      disabled={c.hasOpenDispute}
                      checked={selected.has(c.id)}
                      onChange={() => toggle(c.id)}
                      className="h-4 w-4"
                    />
                    <span className="flex flex-col">
                      <span className="font-semibold">{c.party}</span>
                      <span className="text-xs text-fg-muted">{c.kind}{c.hasOpenDispute ? ' · excluded — open dispute' : ''}</span>
                    </span>
                  </span>
                  <span className="font-mono">{formatMoney(c.amount)}</span>
                </label>
              ))}
            </Card>
            <Card className="flex flex-col gap-3 p-4 sm:p-5">
              <div className="flex justify-between text-sm font-semibold">
                <span>Selected total</span>
                <span className="font-mono">{formatMoney(selectedTotal)}</span>
              </div>
              <TextField label="Prepared by" placeholder="Your name" value={preparer} onChange={(e) => setPreparer(e.target.value)} />
              {error && <span className="text-xs text-danger-text">{error}</span>}
              <Button onClick={onPrepare} disabled={selected.size === 0 || !preparer}>Prepare batch</Button>
            </Card>
          </>
        )}

        {batch.status === 'prepared' && (
          <Card className="flex flex-col gap-3 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <StatusPill tone="warning">Prepared</StatusPill>
              <span className="font-mono font-semibold">{formatMoney(batchTotal)}</span>
            </div>
            <span className="text-sm text-fg-muted">Prepared by <strong>{batch.preparedBy}</strong> — a different reviewer must approve.</span>
            <TextField
              label="Approve as"
              placeholder="A different name than the preparer"
              value={approver}
              onChange={(e) => setApprover(e.target.value)}
              helper={`Suggested reviewers: ${ADMIN_ROSTER.join(', ')}`}
            />
            {error && <span className="text-xs text-danger-text">{error}</span>}
            <div className="flex flex-wrap gap-2">
              <Button onClick={onApprove} disabled={!approver}>Approve and release — {formatMoney(batchTotal)}</Button>
              <Button variant="secondary" onClick={() => { resetBatch(); setSelected(new Set()); setPreparer(''); setApprover(''); setError(''); }}>Discard batch</Button>
            </div>
          </Card>
        )}

        {batch.status === 'approved' && (
          <Card className="flex flex-col gap-2 p-4 sm:p-5">
            <StatusPill tone="success">Released</StatusPill>
            <span className="text-sm text-fg-muted">
              Prepared by {batch.preparedBy}, approved by {batch.approvedBy} — {formatMoney(batchTotal)} released.
            </span>
            <Button variant="secondary" onClick={() => { resetBatch(); setSelected(new Set()); setPreparer(''); setApprover(''); }}>Start a new batch</Button>
          </Card>
        )}
      </div>
    </PermGate>
  );
}
