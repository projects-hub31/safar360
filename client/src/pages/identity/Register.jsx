import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth/useAuth';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';

export default function Register() {
  const navigate = useNavigate();
  const { signupRole, startRegister, startOAuth, startReset } = useAuth();

  const [method, setMethod] = useState('phone');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const passwordError = passwordTouched && password.length < 12 ? 'Use at least 12 characters.' : null;
  const canSubmit = name.trim() && password.length >= 12 && (method === 'phone' ? phone.trim() : email.trim());

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setServerError(null);
    const result = await startRegister({ method, phone, email, password, name });
    setSubmitting(false);
    if (!result.ok) {
      if (result.reason === 'duplicate') setDuplicate(true);
      else setServerError(result.message || 'Something went wrong. Try again.');
      return;
    }
    navigate('/identity/otp');
  };

  const onOAuth = (provider) => {
    startOAuth(provider);
    navigate('/identity/otp');
  };

  const onResetInstead = async () => {
    await startReset({ phone });
    navigate('/identity/otp');
  };

  if (duplicate) {
    return (
      <div className="mx-auto flex max-w-[440px] flex-col gap-4">
        <Card className="flex flex-col gap-3 p-5">
          <span className="font-display text-xl font-semibold tracking-tight">This number may already have an account</span>
          <p className="text-sm leading-relaxed text-fg-muted">
            We won't say more than that here — if it's yours, sign in or reset the password below.
          </p>
          <div className="flex flex-col gap-2 pt-1">
            <Button to="/identity/login">Sign in instead</Button>
            <Button variant="secondary" onClick={onResetInstead}>
              Reset password
            </Button>
            <Button variant="tertiary" size="sm" onClick={() => setDuplicate(false)}>
              Use a different number
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[440px] flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Create your account</h1>
        {signupRole && (
          <p className="text-sm text-fg-muted">
            Signing up as <strong className="text-fg">{signupRole}</strong>.{' '}
            <Link to="/identity/role" className="font-semibold">
              Change
            </Link>
          </p>
        )}
      </div>

      <Card className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex gap-1.5 rounded-lg border border-border bg-sunken p-1">
          {['phone', 'email'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              aria-pressed={method === m}
              className={`min-h-9 flex-1 rounded-md text-[13px] font-semibold capitalize ${
                method === m ? 'bg-surface text-fg shadow-sh1' : 'text-fg-muted'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
          <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />

          {method === 'phone' ? (
            <TextField
              label="Phone number"
              type="tel"
              dir="ltr"
              prefix="+92"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="300 1234567"
            />
          ) : (
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          )}

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setPasswordTouched(true)}
            error={passwordError}
            helper={passwordError ? null : 'At least 12 characters — length is what matters, not symbols.'}
          />

          {serverError && (
            <p role="alert" className="text-sm leading-relaxed text-danger-text">{serverError}</p>
          )}

          <Button type="submit" disabled={!canSubmit || submitting} size="lg">
            {submitting ? 'Creating account…' : 'Continue'}
          </Button>
        </form>

        <div className="flex items-center gap-2.5 text-xs text-fg-subtle">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="flex flex-col gap-2">
          <Button variant="secondary" onClick={() => onOAuth('google')}>
            Continue with Google
          </Button>
          <Button variant="secondary" onClick={() => onOAuth('facebook')}>
            Continue with Facebook
          </Button>
        </div>
      </Card>

      <p className="text-center text-sm text-fg-muted">
        Already have an account?{' '}
        <Link to="/identity/login" className="font-semibold">
          Sign in
        </Link>
      </p>
    </div>
  );
}
