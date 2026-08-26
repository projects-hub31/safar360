import { useCallback, useMemo, useRef, useState } from 'react';
import { AdminContext } from './admin-context';
import {
  KYC_QUEUE, FRAUD_QUEUE, DISPUTES, PAYOUT_CANDIDATES, DEFAULT_POLICY, AUDIT_SEED,
} from './admin-context';
import { useVendor } from '../vendor/useVendor';

// Module 09 (admin console). Three of the five queues below (KYC, fraud,
// disputes) are seeded multi-actor demo data — a single demo account can't
// produce a real multi-vendor/multi-traveller queue on its own, the same
// limitation VendorContext.SEED_LEDGER already documents a pattern for (see
// CLAUDE.md's module 09 build note). What IS real: this session's own vendor
// ledger (merged in on the Ledger screen), and the social moderation queue
// (SocialContext's real posts/reports — read directly by the Moderation
// screen, not duplicated here). Where a seeded row's `linkedLedgerId` points
// at a real VendorContext ledger row (fr-1/dp-1 → LG-4002, dp-2 → LG-4004),
// resolving it for real calls VendorContext.reverseLedger — everything else
// is a local, honestly-scoped mutation of this file's own seed arrays.
export function AdminProvider({ children }) {
  const { reverseLedger: reverseVendorLedger } = useVendor();

  const [adminRole, setAdminRole] = useState('super');
  const [policy, setPolicy] = useState(DEFAULT_POLICY);
  const [kycQueue, setKycQueue] = useState(KYC_QUEUE);
  const [fraudQueue, setFraudQueue] = useState(FRAUD_QUEUE);
  const [disputes, setDisputes] = useState(DISPUTES);
  const [payoutCandidates] = useState(PAYOUT_CANDIDATES);
  const [batch, setBatch] = useState({ status: 'draft', candidateIds: [], preparedBy: null, approvedBy: null, preparedAt: null, approvedAt: null });
  const [audit, setAudit] = useState(AUDIT_SEED);
  const nextId = useRef(1);

  const logAction = useCallback(({ actor = 'You', action, target, category, tone = 'success', refused = false }) => {
    setAudit((rows) => [{ id: `au-live-${nextId.current++}`, at: Date.now(), actor, action, target, category, tone, refused }, ...rows]);
  }, []);

  // --- KYC (§3 KYC — approve/reject mirrors AuthContext's shared setKycStatus
  // semantics for this queue's own seeded rows; the one row genuinely tied to
  // this session's live demo account is composed directly by the Kyc screen
  // using useAuth().setKycStatus instead, so it doesn't get duplicated here) --
  const approveKyc = useCallback((id) => {
    const row = kycQueue.find((r) => r.id === id);
    if (!row) return;
    setKycQueue((rs) => rs.map((r) => (r.id === id ? { ...r, status: 'approved', decidedAt: Date.now(), decidedBy: 'You', reasonId: null, reasonLabel: null } : r)));
    logAction({ action: 'KYC approved', target: row.vendorName, category: 'kyc', tone: 'success' });
  }, [kycQueue, logAction]);

  const rejectKyc = useCallback((id, reasonId, reasonLabel) => {
    const row = kycQueue.find((r) => r.id === id);
    if (!row || !reasonId) return;
    setKycQueue((rs) => rs.map((r) => (r.id === id ? { ...r, status: 'rejected', decidedAt: Date.now(), decidedBy: 'You', reasonId, reasonLabel } : r)));
    logAction({ action: `KYC rejected — ${reasonLabel}`, target: row.vendorName, category: 'kyc', tone: 'danger' });
  }, [kycQueue, logAction]);

  // --- Fraud review (§3 — three resolution actions map to ordinary actions) --
  const clearFraud = useCallback((id) => {
    const row = fraudQueue.find((r) => r.id === id);
    if (!row) return;
    setFraudQueue((rs) => rs.map((r) => (r.id === id ? { ...r, status: 'cleared', resolvedAt: Date.now(), resolvedBy: 'You' } : r)));
    logAction({ action: 'Fraud review cleared', target: row.bookingRef, category: 'money', tone: 'success' });
  }, [fraudQueue, logAction]);

  const refundFraud = useCallback((id) => {
    const row = fraudQueue.find((r) => r.id === id);
    if (!row) return;
    setFraudQueue((rs) => rs.map((r) => (r.id === id ? { ...r, status: 'refunded', resolvedAt: Date.now(), resolvedBy: 'You' } : r)));
    if (row.linkedLedgerId) reverseVendorLedger(row.linkedLedgerId);
    logAction({ action: 'Fraud review refunded', target: row.bookingRef, category: 'money', tone: 'held' });
  }, [fraudQueue, reverseVendorLedger, logAction]);

  const askForId = useCallback((id) => {
    const row = fraudQueue.find((r) => r.id === id);
    if (!row) return;
    setFraudQueue((rs) => rs.map((r) => (r.id === id ? { ...r, status: 'ask-id' } : r)));
    logAction({ action: 'Fraud review — asked traveller for ID', target: row.bookingRef, category: 'money', tone: 'warning' });
  }, [fraudQueue, logAction]);

  // --- Disputes (§3 — refund in full / split / release, ordinary actions) ---
  // VendorContext's ledger row shape only models a full reversal (no partial-
  // amount state) — a real gap, not silently papered over: `split`/`release`
  // record the resolution here but only `refund` (full) actually flips a
  // linked ledger row, since that's the one case the existing shape supports.
  const resolveDispute = useCallback((id, { type, amount, note }) => {
    const row = disputes.find((d) => d.id === id);
    if (!row || !note) return { ok: false, error: 'A reasoning note is required.' };
    setDisputes((ds) => ds.map((d) => (d.id === id ? {
      ...d, status: 'resolved', resolution: { type, amount, note, decidedAt: Date.now(), decidedBy: 'You' },
    } : d)));
    if (type === 'refund' && row.linkedLedgerId) reverseVendorLedger(row.linkedLedgerId);
    logAction({ action: `Dispute resolved — ${type}`, target: `${row.id} · ${row.bookingRef}`, category: 'moderation', tone: 'held' });
    return { ok: true };
  }, [disputes, reverseVendorLedger, logAction]);

  // --- Payout batch (§3 — two-step approval enforced by identity) -----------
  const prepareBatch = useCallback((candidateIds, preparerName) => {
    if (!preparerName) return { ok: false, error: 'Name the preparer.' };
    const excluded = candidateIds.filter((cid) => payoutCandidates.find((c) => c.id === cid)?.hasOpenDispute);
    if (excluded.length) return { ok: false, error: 'A payee with an open dispute can\'t be included in a batch.' };
    setBatch({ status: 'prepared', candidateIds, preparedBy: preparerName, approvedBy: null, preparedAt: Date.now(), approvedAt: null });
    logAction({ actor: preparerName, action: `Payout batch prepared — ${candidateIds.length} payee(s)`, target: 'Payout batch', category: 'money', tone: 'success' });
    return { ok: true };
  }, [payoutCandidates, logAction]);

  const approveBatch = useCallback((approverName) => {
    if (batch.status !== 'prepared') return { ok: false, error: 'No prepared batch to approve.' };
    if (!approverName) return { ok: false, error: 'Name the approver.' };
    if (approverName.trim().toLowerCase() === (batch.preparedBy || '').trim().toLowerCase()) {
      logAction({ actor: approverName, action: 'Payout batch approval refused — same identity as preparer', target: 'Payout batch', category: 'money', tone: 'danger', refused: true });
      return { ok: false, error: `${approverName} also prepared this batch — a second, different approver is required.` };
    }
    setBatch((b) => ({ ...b, status: 'approved', approvedBy: approverName, approvedAt: Date.now() }));
    logAction({ actor: approverName, action: 'Payout batch approved and released', target: 'Payout batch', category: 'money', tone: 'success' });
    return { ok: true };
  }, [batch, logAction]);

  const resetBatch = useCallback(
    () => setBatch({ status: 'draft', candidateIds: [], preparedBy: null, approvedBy: null, preparedAt: null, approvedAt: null }),
    [],
  );

  // --- Policy config (§3 Policy object) --------------------------------------
  const savePolicy = useCallback((patch, changedSummary) => {
    setPolicy((p) => ({ ...p, ...patch }));
    logAction({ action: `Policy changed — ${changedSummary}`, target: 'Policy config', category: 'money', tone: 'warning' });
  }, [logAction]);

  const value = useMemo(() => ({
    adminRole, setAdminRole,
    policy, savePolicy,
    kycQueue, approveKyc, rejectKyc,
    fraudQueue, clearFraud, refundFraud, askForId,
    disputes, resolveDispute,
    payoutCandidates, batch, prepareBatch, approveBatch, resetBatch,
    audit, logAction,
  }), [
    adminRole, policy, savePolicy,
    kycQueue, approveKyc, rejectKyc,
    fraudQueue, clearFraud, refundFraud, askForId,
    disputes, resolveDispute,
    payoutCandidates, batch, prepareBatch, approveBatch, resetBatch,
    audit, logAction,
  ]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
