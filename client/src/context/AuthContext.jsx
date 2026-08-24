import { useState } from 'react';
import { AuthContext, PARTNER_ROLES } from './auth-context';

const OTP_MAX_ATTEMPTS = 5;

// --- Mock auth, until server/ has real endpoints -----------------------
// Every value below stands in for a server decision (§2 Law 1: the server
// is the truth). Swap each function's body for a fetch() when the API
// exists; the shape callers use (return { ok, ... }) is designed to make
// that swap a body-only change.
const MAGIC_OTP = '419027'; // wireframe's documented magic verify code, §6
const DUPLICATE_PHONE = '3004821776'; // wireframe's documented dupe-account trigger, §6

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

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
  // restarts the flow, same as losing a session with no backend behind it.
  // `otpToken` is not a timestamp, just an opaque counter the OTP screen uses
  // as a React `key` to restart its countdown on resend — see Countdown.jsx.
  const [pending, setPending] = useState(null);

  const persistUser = (next) => {
    setUser(next);
    writeUser(next);
  };

  const chooseRole = (roleId) => setSignupRole(roleId);

  // Returns { ok: true } to proceed to OTP, or { ok: false, reason: 'duplicate' }
  // to show the "this account may exist" panel (§6 register) — never confirms
  // outright, so the flow can't be used to enumerate accounts.
  const startRegister = ({ method, phone, email, password, name }) => {
    if (method === 'phone' && normalizePhone(phone) === DUPLICATE_PHONE) {
      return { ok: false, reason: 'duplicate' };
    }
    setPending({
      purpose: 'register',
      method,
      phone: method === 'phone' ? phone : null,
      email: method === 'email' ? email : null,
      password,
      name: name || null,
      attempts: 0,
      otpToken: 0,
    });
    return { ok: true };
  };

  // OAuth stubs still land on OTP — the source spec keeps phone verification
  // mandatory regardless of how the account started (§6 register).
  const startOAuth = (provider) => {
    setPending({
      purpose: 'register',
      method: 'oauth',
      provider,
      phone: '300 0000000',
      email: null,
      name: provider === 'google' ? 'Google account' : 'Facebook account',
      attempts: 0,
      otpToken: 0,
    });
    return { ok: true };
  };

  // Password reset reuses the OTP component and, on success, revokes every
  // existing session — here that just means replacing `user` outright rather
  // than patching it (§6 register).
  const startReset = ({ phone }) => {
    setPending({
      purpose: 'reset',
      method: 'phone',
      phone,
      email: null,
      attempts: 0,
      otpToken: 0,
    });
    return { ok: true };
  };

  const resendOtp = () => {
    setPending((p) => (p ? { ...p, attempts: 0, otpToken: p.otpToken + 1 } : p));
  };

  // Returns { ok: true } on success, or { ok: false, attemptsLeft, exhausted }.
  const verifyOtp = (code) => {
    if (!pending) return { ok: false, attemptsLeft: 0, exhausted: true };

    if (code !== MAGIC_OTP) {
      const attempts = pending.attempts + 1;
      const exhausted = attempts >= OTP_MAX_ATTEMPTS;
      setPending((p) => (p ? { ...p, attempts } : p));
      return { ok: false, attemptsLeft: Math.max(0, OTP_MAX_ATTEMPTS - attempts), exhausted };
    }

    if (pending.purpose === 'register') {
      const role = signupRole || 'traveller';
      persistUser({
        name: pending.name || 'Traveller',
        phone: pending.phone,
        email: pending.email,
        role,
        verified: true,
        kycStatus: PARTNER_ROLES.includes(role) ? 'none' : null,
        kycReason: null,
      });
    } else {
      // Reset: sign back in as whatever account this device already knew,
      // falling back to a fresh traveller session if none was stored.
      persistUser(user || { name: 'Traveller', phone: pending.phone, email: null, role: 'traveller', verified: true, kycStatus: null, kycReason: null });
    }
    setPending(null);
    return { ok: true };
  };

  // Mock sign-in: any non-empty password succeeds. A real backend replaces
  // this whole body; the caller-facing shape ({ ok }) doesn't need to change.
  const login = ({ identifier, password }) => {
    if (!password) return { ok: false };
    persistUser(
      user && (user.phone === identifier || user.email === identifier)
        ? user
        : { name: 'Traveller', phone: identifier, email: null, role: 'traveller', verified: true, kycStatus: null, kycReason: null },
    );
    return { ok: true };
  };

  const signOut = () => persistUser(null);

  const submitKyc = (payload) => {
    persistUser(user ? { ...user, kycStatus: 'pending', kyc: payload, kycReason: null } : user);
  };

  // Lets a not-yet-built admin console (module 09) flip this later; also used
  // by the two "preview" links on kyc-pending until that console exists.
  const setKycStatus = (status, reason = null) => {
    persistUser(user ? { ...user, kycStatus: status, kycReason: reason } : user);
  };

  // The wireframe's own shell has a role switcher (§5 per-role nav) — this is
  // a single demo account acting as different actors for testing, the same
  // way the source spec's shared SEED store works, not a real multi-tenant
  // account system (that needs a real backend). Switching into a partner role
  // for the first time starts KYC at 'none'; switching back later preserves
  // whatever KYC status that role had reached, rather than resetting it.
  const switchRole = (roleId) => {
    persistUser(user ? {
      ...user,
      role: roleId,
      kycStatus: PARTNER_ROLES.includes(roleId) ? (user.kycStatus ?? 'none') : user.kycStatus,
    } : user);
  };

  const value = {
    user,
    signupRole,
    pending,
    chooseRole,
    startRegister,
    startOAuth,
    startReset,
    resendOtp,
    verifyOtp,
    login,
    signOut,
    submitKyc,
    setKycStatus,
    switchRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
