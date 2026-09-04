import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext, PARTNER_ROLES, ROLES } from './auth-context';
import { api, getAccessToken, setAccessToken } from '../../utils/api';

// --- Real auth (server/src/routes/identity) -----------------------------
// register/login/OTP/refresh/logout below call the actual backend (CLAUDE.md
// §9 — identity module, verified end-to-end). The magic OTP code stays valid
// as the server's own documented dev bypass (server/src/utils/otp.js), so no
// UI here needed to change to keep using it. quickSignIn/switchRole now call
// the real backend too (one fixed real test account per self-registerable
// role — see signInAsRealRole below), since a role-gated real endpoint (the
// vendor module's `requireRole('operator')`) checks the JWT's own role
// claim, not anything the client merely asserts. submitKyc/setKycStatus/
// startOAuth remain client-only testing levers — there's no real
// client-triggerable KYC-*decision* endpoint (that's an admin action, and
// the admin console itself isn't built yet, CLAUDE.md §9) and no real OAuth
// provider is wired up, so those stay mocked and clearly labeled as such in
// the UI that surfaces them.

// One fixed real test account per self-registerable role, used by
// signInAsRealRole below (quickSignIn/switchRole) — not a secret, just a
// deterministic identity so the same demo account is reused across calls
// instead of registering a fresh one every time.
const QUICK_TEST_PASSWORD = 'quicksignin123';
const QUICK_TEST_PHONE = {
  traveller: '3009000001',
  operator: '3009000002',
  transport: '3009000003',
  property: '3009000004',
  seller: '3009000005',
  influencer: '3009000006',
};

function readUser() {
  try {
    const raw = localStorage.getItem('s360-user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeUser(user) {
  try {
    if (user) localStorage.setItem('s360-user', JSON.stringify(user));
    else localStorage.removeItem('s360-user');
  } catch {
    /* storage unavailable */
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);
  // The role chosen on the role-select screen, read by Register to shape
  // its copy and by the OTP screen to decide where success routes to.
  const [signupRole, setSignupRole] = useState(null);
  // In-flight verification. Deliberately NOT persisted — refreshing mid-OTP
  // restarts the flow, matching a real OTP session's short lifetime.
  // `otpToken` is not a timestamp, just an opaque counter the OTP screen uses
  // as a React `key` to restart its countdown on resend — see Countdown.jsx.
  const [pending, setPending] = useState(null);

  const persistUser = useCallback((next) => {
    setUser(next);
    writeUser(next);
  }, []);

  // Rehydrate a real session on load/refresh: if an access token survived
  // (localStorage), confirm it (or its refresh-cookie-backed replacement)
  // against the server rather than trusting the cached `user` blindly — a
  // quickSignIn/switchRole demo user has no access token at all, so this
  // simply no-ops for them (they stay exactly as they were).
  useEffect(() => {
    if (!getAccessToken()) return;
    api.get('/identity/auth/me').then((res) => {
      if (res.ok) persistUser(res.data);
      else {
        setAccessToken(null);
        persistUser(null);
      }
    });
    // Runs once on mount only — persistUser is stable (useCallback, no deps).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chooseRole = useCallback((roleId) => setSignupRole(roleId), []);

  // Returns { ok: true } to proceed to OTP, or { ok: false, reason: 'duplicate' }
  // to show the "this account may exist" panel (§6 register) — never confirms
  // outright, so the flow can't be used to enumerate accounts (the server
  // enforces this the same way, ApiError DUPLICATE_ACCOUNT).
  const startRegister = useCallback(async ({ method, phone, email, password, name }) => {
    const role = signupRole || 'traveller';
    const res = await api.post('/identity/auth/register', { method, phone, email, password, name, role }, { auth: false });
    if (!res.ok) {
      if (res.error.code === 'DUPLICATE_ACCOUNT') return { ok: false, reason: 'duplicate' };
      return { ok: false, reason: 'error', message: res.error.message };
    }
    setPending({
      purpose: 'register',
      userId: res.data.userId,
      phone: method === 'phone' ? phone : null,
      email: method === 'email' ? email : null,
      otpToken: 0,
    });
    return { ok: true };
  }, [signupRole]);

  // No real OAuth provider is wired up server-side — kept as a client-only
  // stub (never reaches a real account), clearly out of scope until a
  // provider is chosen.
  const startOAuth = useCallback((provider) => {
    setPending({
      purpose: 'register',
      method: 'oauth-mock',
      provider,
      phone: null,
      email: null,
      otpToken: 0,
      mock: true,
    });
    return { ok: true };
  }, []);

  // Password reset: step 1 of 2. Never confirms whether the account exists
  // (server mirrors this — password.controller.js always replies `sent:true`).
  const startReset = useCallback(async ({ phone, email }) => {
    const identifier = phone || email;
    const res = await api.post('/identity/password/forgot', { identifier }, { auth: false });
    if (!res.ok) return { ok: false, message: res.error.message };
    setPending({
      purpose: 'reset',
      userId: res.data.userId || null,
      phone: phone || null,
      email: email || null,
      otpToken: 0,
    });
    return { ok: true };
  }, []);

  const resendOtp = useCallback(async () => {
    if (!pending?.userId) {
      setPending((p) => (p ? { ...p, otpToken: p.otpToken + 1 } : p));
      return;
    }
    await api.post('/identity/auth/otp/resend', { userId: pending.userId, purpose: pending.purpose }, { auth: false });
    setPending((p) => (p ? { ...p, otpToken: p.otpToken + 1 } : p));
  }, [pending]);

  // Returns { ok: true } on success (register: signed in; reset: needs a new
  // password next, see completeReset), or { ok: false, exhausted, message }.
  const verifyOtp = useCallback(async (code) => {
    // The OAuth mock path never created a real account server-side — nothing
    // to verify against, so it "succeeds" locally same as before.
    if (pending?.mock) {
      const role = signupRole || 'traveller';
      persistUser({
        name: pending.provider === 'google' ? 'Google account' : 'Facebook account',
        phone: null, email: null, role, verified: true,
        kycStatus: PARTNER_ROLES.includes(role) ? 'none' : null, kycReason: null,
      });
      setPending(null);
      return { ok: true };
    }

    if (!pending?.userId) return { ok: false, exhausted: true, message: 'Nothing to verify. Start again.' };

    const res = await api.post('/identity/auth/otp/verify', { userId: pending.userId, code, purpose: pending.purpose }, { auth: false });
    if (!res.ok) {
      return { ok: false, exhausted: res.error.code === 'OTP_EXHAUSTED', message: res.error.message };
    }

    if (pending.purpose === 'reset') {
      setPending((p) => (p ? { ...p, resetToken: res.data.resetToken } : p));
      return { ok: true, needsNewPassword: true };
    }

    setAccessToken(res.data.accessToken);
    persistUser(res.data.user);
    setPending(null);
    return { ok: true };
  }, [pending, signupRole, persistUser]);

  // Step 2 of password reset — sets the new password against the short-lived
  // resetToken OTP verify issued, then revokes every session (server-side).
  // The user signs in fresh afterward; this doesn't auto-issue a session.
  const completeReset = useCallback(async (newPassword) => {
    if (!pending?.resetToken) return { ok: false, message: 'Start the reset again.' };
    const res = await api.post('/identity/password/reset', { resetToken: pending.resetToken, newPassword }, { auth: false });
    if (!res.ok) return { ok: false, message: res.error.message };
    setPending(null);
    return { ok: true };
  }, [pending]);

  const login = useCallback(async ({ identifier, password }) => {
    const res = await api.post('/identity/auth/login', { identifier, password }, { auth: false });
    if (!res.ok) return { ok: false, message: res.error.message };
    setAccessToken(res.data.accessToken);
    persistUser(res.data.user);
    return { ok: true };
  }, [persistUser]);

  const signOut = useCallback(() => {
    api.post('/identity/auth/logout', {}, { auth: false }).catch(() => {});
    setAccessToken(null);
    persistUser(null);
  }, [persistUser]);

  // One fixed real test account per self-registerable role — a genuine
  // register-or-login round trip against the real backend, not a locally
  // relabeled fake user. This matters because role-gated real endpoints
  // (e.g. the vendor module's `requireRole('operator')`) check the role
  // baked into the JWT itself, not anything the client claims (§2 law: "the
  // UI gate is never the security control") — a quickSignIn/switchRole that
  // only sets `user.role` locally carries no token at all, so every such
  // endpoint 401s/403s. Idempotent: the first call for a role registers and
  // auto-verifies via the server's own documented OTP dev-bypass code
  // (`419027`, server/src/utils/otp.js); every call after that — this
  // session or a future one, from either quickSignIn or switchRole — just
  // logs in with the same fixed credentials, since the account already
  // exists and is verified. Each role's own real state (KYC, subscription,
  // listings, bookings) persists on the server across switches, same as any
  // real account would, with no client-side bookkeeping needed for it.
  const signInAsRealRole = useCallback(async (roleId) => {
    const phone = QUICK_TEST_PHONE[roleId];
    const role = ROLES.find((r) => r.id === roleId);
    const reg = await api.post('/identity/auth/register', {
      method: 'phone', phone, password: QUICK_TEST_PASSWORD, role: roleId, name: `Test ${role?.label || roleId}`,
    }, { auth: false });

    let session;
    if (reg.ok) {
      const otp = await api.post('/identity/auth/otp/verify', {
        userId: reg.data.userId, code: '419027', purpose: 'register',
      }, { auth: false });
      if (!otp.ok) return { ok: false, message: otp.error.message };
      session = otp.data;
    } else if (reg.error.code === 'DUPLICATE_ACCOUNT') {
      // Already created by an earlier quick-sign-in/switch — this role's
      // fixed test account exists and is verified, so just log in.
      const loginRes = await api.post('/identity/auth/login', { identifier: phone, password: QUICK_TEST_PASSWORD }, { auth: false });
      if (!loginRes.ok) return { ok: false, message: loginRes.error.message };
      session = loginRes.data;
    } else {
      return { ok: false, message: reg.error.message };
    }

    setAccessToken(session.accessToken);
    persistUser(session.user);
    return { ok: true };
  }, [persistUser]);

  // Admin has no self-registration (§4/§9 — a real admin account is seeded
  // server-side, never created from the client), so it's the one role that
  // stays a local-only mock — clearly not a real capability, same as every
  // testing lever here. No real admin endpoints exist yet for it to fail
  // against either way (module 09's backend isn't built).
  const mockAdminUser = useCallback(() => {
    setAccessToken(null);
    persistUser({ name: 'Test Admin', phone: '3000000000', email: null, role: 'admin', verified: true, kycStatus: null, kycReason: null });
    return { ok: true };
  }, [persistUser]);

  // Testing-only shortcut, not part of the wireframe spec — signs straight
  // in as a fresh test account for any of the 7 roles with no phone/OTP
  // entry, so every RequireAuth/RequireRole-gated screen (§8) is reachable
  // in one click while testing. Partner roles no longer start pre-approved
  // on KYC (that would mean silently faking a real admin decision, §3: "the
  // model does not decide, a person decides" — the same principle applies
  // here) — walk the real KYC/subscription flow from a fresh account, same
  // as any real vendor would.
  const quickSignIn = useCallback((roleId) => (roleId === 'admin' ? mockAdminUser() : signInAsRealRole(roleId)), [mockAdminUser, signInAsRealRole]);

  // Still the mock path for the roles the real KYC backend doesn't support
  // yet (transport/property/seller — see utils/kycDocs.js's own note); the
  // `operator` role uses the real document actions below instead.
  const submitKyc = useCallback((payload) => {
    persistUser(user ? { ...user, kycStatus: 'pending', kyc: payload, kycReason: null } : user);
  }, [user, persistUser]);

  // --- real KYC documents (operator only — server/src/routes/vendor,
  // gated by requireRole('operator')) --------------------------------------
  const fetchKycDocuments = useCallback(async () => {
    const res = await api.get('/vendor/kyc/documents');
    return res.ok ? { ok: true, documents: res.data.documents, required: res.data.required } : { ok: false, message: res.error.message };
  }, []);

  // `type` is a server type id (utils/kycDocs.js's DOC_TYPE) — resubmission
  // scoped per document is the server's own behavior (kyc.service.js upserts
  // the same (vendor, type) row), not something this call needs to know.
  const submitKycDocument = useCallback(async (type, fileRef) => {
    const res = await api.post('/vendor/kyc/documents', { type, fileRef });
    return res.ok ? { ok: true, document: res.data } : { ok: false, message: res.error.message };
  }, []);

  // Re-reads the real `user` (incl. `kycStatus`, recomputed server-side on
  // every document submit/review) — submitting a document or polling for a
  // decision doesn't otherwise touch the locally-cached `user` object.
  const refreshUser = useCallback(async () => {
    const res = await api.get('/identity/auth/me');
    if (res.ok) persistUser(res.data);
    return res.ok ? { ok: true, user: res.data } : { ok: false, message: res.error?.message };
  }, [persistUser]);

  // Lets a not-yet-built admin console (module 09) flip this later; also used
  // by the two "preview" links on kyc-pending until that console exists.
  const setKycStatus = useCallback((status, reason = null) => {
    persistUser(user ? { ...user, kycStatus: status, kycReason: reason } : user);
  }, [user, persistUser]);

  // The wireframe's own shell has a role switcher (§5 per-role nav) — now
  // that quickSignIn is a real per-role account (above), switching "Acting
  // as" has to be the same real operation, or a switch into e.g. 'operator'
  // would carry whatever role's JWT was already in hand and 403 against the
  // vendor module's real `requireRole('operator')` gate. Still not real
  // multi-tenancy (each role is its own fixed test account, not the current
  // human's account), just an honest version of the same demo shortcut.
  const switchRole = useCallback((roleId) => (roleId === 'admin' ? mockAdminUser() : signInAsRealRole(roleId)), [mockAdminUser, signInAsRealRole]);

  const value = useMemo(() => ({
    user,
    signupRole,
    pending,
    chooseRole,
    startRegister,
    startOAuth,
    startReset,
    resendOtp,
    verifyOtp,
    completeReset,
    login,
    signOut,
    quickSignIn,
    submitKyc,
    fetchKycDocuments,
    submitKycDocument,
    refreshUser,
    setKycStatus,
    switchRole,
  }), [
    user, signupRole, pending, chooseRole, startRegister, startOAuth, startReset,
    resendOtp, verifyOtp, completeReset, login, signOut, quickSignIn, submitKyc,
    fetchKycDocuments, submitKycDocument, refreshUser, setKycStatus, switchRole,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
