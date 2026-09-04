import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth/useAuth';
import { ROLES } from '../../context/auth/auth-context';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';

export default function Login() {
  const navigate = useNavigate();
  const { login, quickSignIn } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [quickSigningInAs, setQuickSigningInAs] = useState(null);
  const [quickSignInError, setQuickSignInError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const result = await login({ identifier, password });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message || 'Enter your password to continue.');
      return;
    }
    navigate('/discover/home');
  };

  const onQuickSignIn = async (roleId) => {
    if (quickSigningInAs) return;
    setQuickSigningInAs(roleId);
    setQuickSignInError(null);
    const result = await quickSignIn(roleId);
    setQuickSigningInAs(null);
    if (!result.ok) {
      setQuickSignInError(result.message || 'Could not sign in as that role. Try again.');
      return;
    }
    navigate(ROLES.find((r) => r.id === roleId).nav[0][1]);
  };

  return (
    <div className="mx-auto flex max-w-[440px] flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Sign in</h1>
        <p className="text-sm leading-relaxed text-fg-muted">Use the phone or email you registered with.</p>
      </div>

      <Card className="flex flex-col gap-4 p-4 sm:p-5">
        <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
          <TextField
            label="Phone or email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="300 1234567 or you@example.com"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error}
          />
          <Button type="submit" disabled={!identifier.trim() || submitting} size="lg">
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <p className="text-center text-xs text-fg-muted">
          Forgot your password?{' '}
          <Link to="/identity/register" className="font-semibold">
            Register your number
          </Link>{' '}
          to reset it — we'll recognise it and offer a reset instead.
        </p>
      </Card>

      <Card className="flex flex-col gap-2 p-4 text-xs leading-relaxed text-fg-muted sm:p-5">
        <strong className="text-[13px] text-fg">How we keep this account safe</strong>
        <span>A reused or replayed session token signs you out everywhere, not just here.</span>
        <span>Resetting your password ends every other signed-in session immediately.</span>
        <span>Recovery always sends a one-time code — never a password, and support can't read or set one.</span>
        <span>Repeated failed sign-ins on a number are rate-limited; we'll tell you if that happens.</span>
      </Card>

      <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border-loud p-4">
        <span className="font-mono text-[11px] uppercase tracking-wider text-fg-subtle">
          Quick sign-in · testing only, not a real account
        </span>
        <p className="text-xs leading-relaxed text-fg-muted">
          Skips phone entry and the OTP screen — signs you into one fixed real test account per role (a genuine
          account on this server, registered the first time you use it). Partner roles start fresh, same as any
          real vendor — walk KYC and a plan for real. Once signed in, switch between all 7 roles any time from
          "Acting as" in the header.
        </p>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onQuickSignIn(r.id)}
              disabled={Boolean(quickSigningInAs)}
              className="min-h-9 rounded-lg border border-border-loud bg-surface px-3 text-xs font-semibold text-fg disabled:opacity-50"
            >
              {quickSigningInAs === r.id ? 'Signing in…' : r.label}
            </button>
          ))}
        </div>
        {quickSignInError && <p role="alert" className="text-xs text-danger-text">{quickSignInError}</p>}
      </div>

      <p className="text-center text-sm text-fg-muted">
        New here?{' '}
        <Link to="/identity/role" className="font-semibold">
          Create an account
        </Link>
      </p>
    </div>
  );
}
