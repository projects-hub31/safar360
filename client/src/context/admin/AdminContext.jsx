import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminContext } from './admin-context';
import { KYC_QUEUE, PLATFORM_LEDGER_EXTRA } from './admin-context';
import { useAuth } from '../auth/useAuth';
import { api } from '../../utils/api';

// Module 09 (admin console) — real end-to-end now: RBAC by sub-role (real
// `adminRole` middleware server-side, mirrored here for the nav-by-absence
// UI law), the KYC queue's `operator` rows, the platform ledger, fraud
// review, disputes, payout batches, live policy config, and the audit log
// every one of those writes to. `adminRole` is sourced from the real signed-
// in admin account (AuthContext's `user.adminRole`, from a real JWT via
// `/identity/auth/dev-admin-signin` — admin can't self-register, §4) rather
// than a locally-editable variable — a fake local "sub-role preview" would
// silently drift from what the server actually enforces (§2 law: "the
// server is the truth"). Two things stay permanently seeded because no real
// backend exists to replace them yet: `KYC_QUEUE`'s transport/property/
// seller rows (real KYC review only covers `operator`) and
// `PLATFORM_LEDGER_EXTRA`'s referral rows (no referral backend, §9 days
// 12-13 not built) — same "seed stays, real merges in" shape
// VendorContext.SEED_LEDGER already established.
export function AdminProvider({ children }) {
  const { user } = useAuth();
  const adminRole = user?.role === 'admin' ? (user.adminRole || 'super') : null;

  const [policy, setPolicy] = useState(null);
  const [kycQueue, setKycQueue] = useState(KYC_QUEUE);
  const [ledger, setLedger] = useState(PLATFORM_LEDGER_EXTRA);
  const [fraudQueue, setFraudQueue] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [payoutCandidates, setPayoutCandidates] = useState([]);
  const [batch, setBatch] = useState({ status: 'draft', totalAmount: 0, preparedBy: null, approvedBy: null, preparedAt: null, approvedAt: null });
  const [audit, setAudit] = useState([]);

  // --- policy (§3 Policy object) — public read, fetched once at app start
  // (many non-admin screens, e.g. transport/Money.jsx, read live policy too) --
  const fetchConfig = useCallback(async () => {
    const res = await api.get('/admin/config', { auth: false });
    if (res.ok) setPolicy(res.data);
  }, []);

  useEffect(() => {
    api.get('/admin/config', { auth: false }).then((res) => {
      if (res.ok) setPolicy(res.data);
    });
    // Runs once on mount only.
  }, []);

  const savePolicy = useCallback(async (patch) => {
    const res = await api.patch('/admin/config', patch);
    if (res.ok) setPolicy(res.data);
    return res.ok ? { ok: true } : { ok: false, error: res.error.message };
  }, []);

  // --- KYC (real operator rows merge over the permanent seeded rows) -------
  const approveKyc = useCallback((id) => {
    const row = kycQueue.find((r) => r.id === id);
    if (!row) return;
    setKycQueue((rs) => rs.map((r) => (r.id === id ? { ...r, status: 'approved', decidedAt: Date.now(), decidedBy: 'You', reasonId: null, reasonLabel: null } : r)));
  }, [kycQueue]);

  const rejectKyc = useCallback((id, reasonId, reasonLabel) => {
    const row = kycQueue.find((r) => r.id === id);
    if (!row || !reasonId) return;
    setKycQueue((rs) => rs.map((r) => (r.id === id ? { ...r, status: 'rejected', decidedAt: Date.now(), decidedBy: 'You', reasonId, reasonLabel } : r)));
  }, [kycQueue]);

  const fetchKycQueue = useCallback(async () => {
    const res = await api.get('/vendor/kyc/documents/queue');
    if (!res.ok) return { ok: false, message: res.error.message };
    const real = res.data.map((r) => ({
      id: r.vendorId, vendorId: r.vendorId, vendorName: r.vendorName, vendorType: r.vendorType,
      status: r.status, submittedAt: new Date(r.submittedAt).getTime(), documents: r.documents, real: true,
    }));
    setKycQueue((current) => [...current.filter((r) => !r.real), ...real]);
    return { ok: true };
  }, []);

  const reviewKycDocument = useCallback(async (docId, decision, reason) => {
    const res = await api.post(`/vendor/kyc/documents/${docId}/review`, decision === 'rejected' ? { decision, reason } : { decision });
    if (!res.ok) return { ok: false, message: res.error.message };
    await fetchKycQueue();
    return { ok: true };
  }, [fetchKycQueue]);

  // --- ledger (real platform-wide view, permanent seeded referral rows
  // merged in) --------------------------------------------------------------
  const fetchLedger = useCallback(async () => {
    const res = await api.get('/admin/ledger');
    if (!res.ok) return;
    const real = res.data.map((r) => ({ ...r, real: true }));
    setLedger((current) => [...real, ...current.filter((r) => !r.real)]);
  }, []);

  const reverseLedgerRow = useCallback(async (id) => {
    const res = await api.post(`/admin/ledger/${id}/reverse`);
    if (res.ok) setLedger((rows) => rows.map((r) => (r.id === id ? { ...res.data, real: true } : r)));
    return res.ok ? { ok: true } : { ok: false, error: res.error.message };
  }, []);

  // --- fraud review (§3 — three resolution actions map to ordinary actions) --
  const fetchFraud = useCallback(async () => {
    const res = await api.get('/admin/fraud');
    if (res.ok) setFraudQueue(res.data);
  }, []);

  const clearFraud = useCallback(async (id) => {
    const res = await api.post(`/admin/fraud/${id}/clear`);
    if (res.ok) setFraudQueue((rs) => rs.map((r) => (r.id === id ? res.data : r)));
  }, []);

  const refundFraud = useCallback(async (id) => {
    const res = await api.post(`/admin/fraud/${id}/refund`);
    if (res.ok) setFraudQueue((rs) => rs.map((r) => (r.id === id ? res.data : r)));
  }, []);

  const askForId = useCallback(async (id) => {
    const res = await api.post(`/admin/fraud/${id}/ask-id`);
    if (res.ok) setFraudQueue((rs) => rs.map((r) => (r.id === id ? res.data : r)));
  }, []);

  // --- disputes (§3 — refund in full / split / release, ordinary actions) ---
  const fetchDisputes = useCallback(async () => {
    const res = await api.get('/admin/disputes');
    if (res.ok) setDisputes(res.data);
  }, []);

  const resolveDispute = useCallback(async (id, { type, amount, note }) => {
    if (!note) return { ok: false, error: 'A reasoning note is required.' };
    const res = await api.post(`/admin/disputes/${id}/resolve`, { type, amount, note });
    if (!res.ok) return { ok: false, error: res.error.message };
    setDisputes((ds) => ds.map((d) => (d.id === id ? { ...d, ...res.data } : d)));
    return { ok: true };
  }, []);

  // --- payout batch (§3 — two-step approval enforced by real identity) -----
  const fetchPayoutCandidates = useCallback(async () => {
    const res = await api.get('/admin/payout-batches/candidates');
    if (res.ok) setPayoutCandidates(res.data.map((c) => ({ ...c, id: c.party })));
  }, []);

  // `candidateIds` are the selected groups' `id`s (party names, see
  // fetchPayoutCandidates above) — flattened to the real ledger row ids the
  // server actually expects.
  const prepareBatch = useCallback(async (candidateIds) => {
    const rows = payoutCandidates.filter((c) => candidateIds.includes(c.id));
    if (!rows.length) return { ok: false, error: 'Select at least one payee.' };
    if (rows.some((r) => r.hasOpenDispute)) return { ok: false, error: "A payee with an open dispute can't be included in a batch." };
    const ledgerRowIds = rows.flatMap((r) => r.ledgerRowIds);
    const res = await api.post('/admin/payout-batches', { ledgerRowIds });
    if (!res.ok) return { ok: false, error: res.error.message };
    setBatch(res.data);
    return { ok: true };
  }, [payoutCandidates]);

  const approveBatch = useCallback(async () => {
    if (batch.status !== 'prepared') return { ok: false, error: 'No prepared batch to approve.' };
    const res = await api.post(`/admin/payout-batches/${batch.id}/approve`);
    if (!res.ok) return { ok: false, error: res.error.message };
    setBatch(res.data);
    return { ok: true };
  }, [batch]);

  const resetBatch = useCallback(
    () => setBatch({ status: 'draft', totalAmount: 0, preparedBy: null, approvedBy: null, preparedAt: null, approvedAt: null }),
    [],
  );

  // --- audit (§3 — one shared, append-only log; every mutation above writes
  // to it server-side, never a second client-local copy) --------------------
  const fetchAudit = useCallback(async (filter = 'all') => {
    const res = await api.get(`/admin/audit?filter=${filter}`);
    if (res.ok) setAudit(res.data);
  }, []);

  const value = useMemo(() => ({
    adminRole,
    policy, fetchConfig, savePolicy,
    kycQueue, approveKyc, rejectKyc, fetchKycQueue, reviewKycDocument,
    ledger, fetchLedger, reverseLedgerRow,
    fraudQueue, fetchFraud, clearFraud, refundFraud, askForId,
    disputes, fetchDisputes, resolveDispute,
    payoutCandidates, fetchPayoutCandidates, batch, prepareBatch, approveBatch, resetBatch,
    audit, fetchAudit,
  }), [
    adminRole,
    policy, fetchConfig, savePolicy,
    kycQueue, approveKyc, rejectKyc, fetchKycQueue, reviewKycDocument,
    ledger, fetchLedger, reverseLedgerRow,
    fraudQueue, fetchFraud, clearFraud, refundFraud, askForId,
    disputes, fetchDisputes, resolveDispute,
    payoutCandidates, fetchPayoutCandidates, batch, prepareBatch, approveBatch, resetBatch,
    audit, fetchAudit,
  ]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
