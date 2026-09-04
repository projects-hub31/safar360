import { useEffect, useState } from 'react';
import { useAdmin } from '../../context/admin/useAdmin';
import { useAuth } from '../../context/auth/useAuth';
import { KYC_REJECT_REASONS } from '../../context/admin/admin-context';
import { PARTNER_ROLES } from '../../context/auth/auth-context';
import { DOC_TYPE_LABEL, REJECTION_LABELS } from '../../utils/kycDocs';
import PermGate from '../../components/admin/PermGate';
import { Card, Button, DataTable, StatusPill, SelectField, Countdown } from '../../components/ui';

const SLA_HOURS = 24;
const TONE = { pending: 'warning', approved: 'success', rejected: 'danger' };
const DOC_TONE = { pending: 'warning', approved: 'success', rejected: 'danger' };
const REAL_REJECT_REASONS = Object.entries(REJECTION_LABELS).map(([id, label]) => ({ id, label }));

// Countdown expects a whole-second duration (it renders the fractional
// remainder verbatim otherwise, e.g. "17:54:14.19…") — always floor here.
function slaSeconds(submittedAt) {
  const elapsed = (Date.now() - submittedAt) / 1000;
  return Math.max(0, Math.floor(SLA_HOURS * 3600 - elapsed));
}

export default function Kyc() {
  const { kycQueue, approveKyc, rejectKyc, fetchKycQueue, reviewKycDocument } = useAdmin();
  const { user, setKycStatus } = useAuth();
  const [rejectingId, setRejectingId] = useState(null);
  const [reasonId, setReasonId] = useState('');
  const [rejectingDocId, setRejectingDocId] = useState(null);
  const [docReasonId, setDocReasonId] = useState('');

  // Real rows (operator applications — the only role the backend supports
  // yet, utils/kycDocs.js's own note) merge in over the permanent seeded
  // rows for the other vendor types.
  useEffect(() => {
    fetchKycQueue();
    // Runs once on mount — fetchKycQueue is stable (useCallback, no deps).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onReject = (id) => {
    const reason = KYC_REJECT_REASONS.find((r) => r.id === reasonId);
    if (!reason) return;
    rejectKyc(id, reason.id, reason.label);
    setRejectingId(null);
    setReasonId('');
  };

  const onApproveDoc = (row, doc) => {
    reviewKycDocument(doc.id, 'approved', null, row.vendorName, DOC_TYPE_LABEL[doc.type] || doc.type);
  };

  const onRejectDoc = (row, doc) => {
    if (!docReasonId) return;
    reviewKycDocument(doc.id, 'rejected', docReasonId, row.vendorName, DOC_TYPE_LABEL[doc.type] || doc.type);
    setRejectingDocId(null);
    setDocReasonId('');
  };

  const rows = kycQueue;
  const columns = [
    { key: 'vendor', label: 'Vendor', render: (r) => (
      <div className="flex flex-col">
        <span className="font-semibold">{r.vendorName}</span>
        <span className="text-xs text-fg-muted">{r.vendorType}{r.region ? ` · ${r.region}` : ''}</span>
      </div>
    ) },
    { key: 'docs', label: 'Documents', render: (r) => (
      r.real ? (
        <div className="flex flex-col gap-2.5 text-xs">
          {r.documents.map((d) => (
            <div key={d.id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{DOC_TYPE_LABEL[d.type] || d.type}</span>
                <StatusPill tone={DOC_TONE[d.status]}>{d.status}</StatusPill>
              </div>
              {d.status === 'rejected' && (
                <span className="text-fg-subtle">{REJECTION_LABELS[d.rejectionReason] || d.rejectionReason}</span>
              )}
              {d.status === 'pending' && (
                rejectingDocId === d.id ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <SelectField
                      value={docReasonId}
                      onChange={(e) => setDocReasonId(e.target.value)}
                      options={[{ value: '', label: 'Choose a reason…' }, ...REAL_REJECT_REASONS.map((rr) => ({ value: rr.id, label: rr.label }))]}
                      className="min-w-[170px]"
                    />
                    <Button size="sm" variant="destructive" disabled={!docReasonId} onClick={() => onRejectDoc(r, d)}>Confirm</Button>
                    <Button size="sm" variant="secondary" onClick={() => { setRejectingDocId(null); setDocReasonId(''); }}>Cancel</Button>
                  </div>
                ) : (
                  <div className="flex gap-1.5">
                    <Button size="sm" onClick={() => onApproveDoc(r, d)}>Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => setRejectingDocId(d.id)}>Reject</Button>
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      ) : <span className="text-xs">{r.documents.length} uploaded</span>
    ) },
    { key: 'sla', label: 'SLA', render: (r) => (
      r.status === 'pending'
        ? <Countdown seconds={slaSeconds(r.submittedAt)} urgentAt={8 * 3600} />
        : <span className="text-xs text-fg-subtle">—</span>
    ) },
    { key: 'status', label: 'Status', render: (r) => (
      <div className="flex flex-col items-end gap-1">
        <StatusPill tone={TONE[r.status]}>{r.status}</StatusPill>
        {!r.real && r.status === 'rejected' && <span className="text-xs text-fg-subtle">{r.reasonLabel}</span>}
      </div>
    ) },
  ];

  return (
    <PermGate permKey="kyc">
      <div className="mx-auto flex max-w-[960px] flex-col gap-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">KYC queue</h1>
        <p className="text-xs leading-relaxed text-fg-subtle">
          24h SLA per submission. Operator rows are real (each document reviewed on its own,
          <code className="font-mono"> POST /api/vendor/kyc/documents/:id/review</code>) — the other vendor
          types stay a demo queue until their own KYC backend exists; those still approve/reject as one whole
          application, requiring one of 4 fixed reasons, shown to the vendor verbatim.
        </p>

        {PARTNER_ROLES.includes(user?.role) && user?.kycStatus === 'pending' && (
          <Card className="flex flex-col gap-3 border-primary p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="font-semibold">{user.kyc?.businessName || 'Your own account'} <span className="font-mono text-xs text-fg-subtle">(this session's live demo account)</span></span>
                <span className="text-xs text-fg-muted">{user.role} · {user.kyc?.region}</span>
              </div>
              <StatusPill tone="warning">pending</StatusPill>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setKycStatus('approved')}>Approve</Button>
              <Button size="sm" variant="destructive" onClick={() => setKycStatus('rejected', KYC_REJECT_REASONS[0].label)}>
                Reject — {KYC_REJECT_REASONS[0].label}
              </Button>
            </div>
          </Card>
        )}

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          emptyTitle="Nothing in the queue"
          emptyBody="Vendor KYC submissions land here."
          renderActions={(r) => {
            if (r.real || r.status !== 'pending') return null;
            if (rejectingId === r.id) {
              return (
                <div className="flex flex-wrap items-center gap-2">
                  <SelectField
                    value={reasonId}
                    onChange={(e) => setReasonId(e.target.value)}
                    options={[{ value: '', label: 'Choose a reason…' }, ...KYC_REJECT_REASONS.map((rr) => ({ value: rr.id, label: rr.label }))]}
                    className="min-w-[180px]"
                  />
                  <Button size="sm" variant="destructive" disabled={!reasonId} onClick={() => onReject(r.id)}>Confirm reject</Button>
                  <Button size="sm" variant="secondary" onClick={() => { setRejectingId(null); setReasonId(''); }}>Cancel</Button>
                </div>
              );
            }
            return (
              <>
                <Button size="sm" onClick={() => approveKyc(r.id)}>Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => setRejectingId(r.id)}>Reject</Button>
              </>
            );
          }}
        />
      </div>
    </PermGate>
  );
}
