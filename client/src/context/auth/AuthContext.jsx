import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext, PARTNER_ROLES, ROLES } from './auth-context';
import { api, getAccessToken, setAccessToken } from '../../utils/api';

// --- Real auth (server/src/routes/identity) -----------------------------
// register/login/OTP/refresh/logout below call the actual backend (CLAUDE.md
// §9 — identity module, verified end-to-end). The magic OTP code stays valid
// as the server's own documented dev bypass (server/src/utils/otp.js), so no
// UI here needed to change to keep using it. quickSignIn/switchRole/
// submitKyc/setKycStatus/startOAuth remain client-only testing levers — the
// backend has no session-switching, KYC-review, or OAuth endpoints yet (KYC
// review lands with the vendor module, CLAUDE.md §9), so those stay mocked
// and clearly labeled as such in the UI that surfaces them.

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

  // Testing-only shortcut, not part of the wireframe spec — signs straight
  // in as a fresh account for any of the 7 roles with no phone/OTP entry,
  // so every RequireAuth/RequireRole-gated screen (§8) is reachable in one
  // click while testing. Partner roles start already `kycStatus: 'approved'`
  // rather than 'none' so a publish gate never blocks this path — approving
  // KYC for real is its own already-built flow (identity/kyc), this is only
  // for skipping straight past it. Same honestly-labeled-lever spirit as
  // `BookingContext.forceOutcome` / the KYC-pending preview links, not
  // hidden magic.
  const quickSignIn = useCallback((roleId) => {
    const role = ROLES.find((r) => r.id === roleId);
    // Not a real account — clear any real access token so this demo identity
    // never accidentally rides a previous real login's session.
    setAccessToken(null);
    persistUser({
      name: `Test ${role?.label || 'User'}`,
      phone: '3000000000',
      email: null,
      role: roleId,
      verified: true,
      kycStatus: PARTNER_ROLES.includes(roleId) ? 'approved' : null,
      kycReason: null,
    });
  }, [persistUser]);

  const submitKyc = useCallback((payload) => {
    persistUser(user ? { ...user, kycStatus: 'pending', kyc: payload, kycReason: null } : user);
  }, [user, persistUser]);

  // Lets a not-yet-built admin console (module 09) flip this later; also used
  // by the two "preview" links on kyc-pending until that console exists.
  const setKycStatus = useCallback((status, reason = null) => {
    persistUser(user ? { ...user, kycStatus: status, kycReason: reason } : user);
  }, [user, persistUser]);

  // The wireframe's own shell has a role switcher (§5 per-role nav) — this is
  // a single demo account acting as different actors for testing, the same
  // way the source spec's shared SEED store works, not a real multi-tenant
  // account system (that needs a real backend). Switching into a partner role
  // for the first time starts KYC at 'none'; switching back later preserves
  // whatever KYC status that role had reached, rather than resetting it.
  const switchRole = useCallback((roleId) => {
    persistUser(user ? {
      ...user,
      role: roleId,
      kycStatus: PARTNER_ROLES.includes(roleId) ? (user.kycStatus ?? 'none') : user.kycStatus,
    } : user);
  }, [user, persistUser]);

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
    setKycStatus,
    switchRole,
  }), [
    user, signupRole, pending, chooseRole, startRegister, startOAuth, startReset,
    resendOtp, verifyOtp, completeReset, login, signOut, quickSignIn, submitKyc, setKycStatus, switchRole,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
