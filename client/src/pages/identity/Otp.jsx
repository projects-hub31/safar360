import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth/useAuth';
import { OTP_TTL_SECONDS, PARTNER_ROLES } from '../../context/auth/auth-context';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Countdown from '../../components/ui/Countdown';

const RESEND_COOLDOWN = 60;

export default function Otp() {
  const navigate = useNavigate();
  const { pending, signupRole, verifyOtp, resendOtp, completeReset } = useAuth();

  const [digits, setDigits] = useState(Array(6).fill(''));
  const [error, setError] = useState(null);
  const [expired, setExpired] = useState(false);
  const [resendIn, setResendIn] = useState(RESEND_COOLDOWN);
  const [verifying, setVerifying] = useState(false);
  const [needsNewPassword, setNeedsNewPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetDone, setResetDone] = useState(false);
  const [resetError, setResetError] = useState(null);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const target = pending?.phone
    ? `+92 ${pending.phone}`.replace(/\s+/g, ' ')
    : pending?.email || '';

  const submit = async (code) => {
    if (verifying) return;
    setVerifying(true);
    const result = await verifyOtp(code);
    setVerifying(false);

    if (result.ok) {
      if (result.needsNewPassword) {
        setNeedsNewPassword(true);
        return;
      }
      const goToKyc = pending?.purpose === 'register' && PARTNER_ROLES.includes(signupRole);
      navigate(goToKyc ? '/identity/kyc' : '/discover/home');
      return;
    }
    if (result.exhausted) {
      navigate('/identity/otp-exhausted');
      return;
    }
    setError(result.message || 'That code is incorrect.');
    setDigits(Array(6).fill(''));
    inputRefs.current[0]?.focus();
  };

  const onSetNewPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setResetError('Use at least 6 characters.');
      return;
    }
    const result = await completeReset(newPassword);
    if (!result.ok) {
      setResetError(result.message || 'Something went wrong. Try again.');
      return;
    }
    setResetDone(true);
  };

  const setDigit = (i, val) => {
    if (!/^[0-9]?$/.test(val)) return;
    const next = digits.slice();
    next[i] = val;
    setDigits(next);
    setError(null);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
    if (next.every((d) => d)) submit(next.join(''));
  };

  const onKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const onPaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length !== 6) return;
    e.preventDefault();
    const next = text.split('');
    setDigits(next);
    inputRefs.current[5]?.focus();
    submit(text);
  };

  const onResend = () => {
    resendOtp();
    setDigits(Array(6).fill(''));
    setError(null);
    setExpired(false);
    setResendIn(RESEND_COOLDOWN);
    inputRefs.current[0]?.focus();
  };

  if (!pending && !resetDone) {
    return (
      <Card className="mx-auto flex max-w-[440px] flex-col items-start gap-3 p-6">
        <span className="font-display text-xl font-semibold tracking-tight">Nothing to verify</span>
        <p className="text-sm leading-relaxed text-fg-muted">
          Start from registration or sign-in and we'll bring you back here when there's a code on the way.
        </p>
        <Button to="/identity/register">Back to registration</Button>
      </Card>
    );
  }

  if (resetDone) {
    return (
      <Card className="mx-auto flex max-w-[440px] flex-col items-start gap-3 p-6">
        <span className="font-display text-xl font-semibold tracking-tight">Password updated</span>
        <p className="text-sm leading-relaxed text-fg-muted">
          Every other signed-in session was ended. Sign in again with your new password.
        </p>
        <Button to="/identity/login">Sign in</Button>
      </Card>
    );
  }

  if (needsNewPassword) {
    return (
      <div className="mx-auto flex max-w-[440px] flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Set a new password</h1>
          <p className="text-sm leading-relaxed text-fg-muted">
            Verified. Choose a new password — this ends every other signed-in session.
          </p>
        </div>
        <Card className="flex flex-col gap-3.5 p-4 sm:p-5">
          <form onSubmit={onSetNewPassword} className="flex flex-col gap-3.5">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setResetError(null); }}
              placeholder="New password"
              className="min-h-11 rounded-lg border border-border-strong bg-raised px-3 text-[15px] text-fg"
            />
            {resetError && <p role="alert" className="text-sm text-danger-text">{resetError}</p>}
            <Button type="submit" size="lg">Set password</Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[440px] flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Enter the code</h1>
        <p className="text-sm leading-relaxed text-fg-muted">
          We sent 6 digits to <span dir="ltr">{target}</span>.
        </p>
      </div>

      <Card className="flex flex-col gap-4 p-4 sm:p-5">
        <div dir="ltr" className="flex justify-center gap-2" onPaste={onPaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              disabled={expired || verifying}
              aria-label={`Digit ${i + 1} of 6`}
              className={`h-14 w-11 rounded-lg border text-center font-mono text-xl font-bold text-fg ${
                error ? 'border-danger' : 'border-border-strong'
              } ${expired ? 'bg-sunken text-fg-subtle' : 'bg-raised'}`}
            />
          ))}
        </div>

        {error && (
          <p role="alert" className="flex items-start gap-1.5 text-sm leading-relaxed text-danger-text">
            <span aria-hidden="true">✕</span>
            <span>{error}</span>
          </p>
        )}

        {expired && (
          <p role="alert" className="flex items-start gap-1.5 text-sm leading-relaxed text-danger-text">
            <span aria-hidden="true">✕</span>
            <span>That code has expired. Send a new one.</span>
          </p>
        )}

        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-fg-muted">{expired ? 'Expired' : 'Expires in'}</span>
          {!expired && (
            <Countdown key={pending.otpToken} seconds={OTP_TTL_SECONDS} urgentAt={30} onExpire={() => setExpired(true)} />
          )}
        </div>

        <Button variant="secondary" onClick={onResend} disabled={resendIn > 0 && !expired}>
          {resendIn > 0 && !expired ? `Resend code in ${resendIn}s` : 'Resend code'}
        </Button>
      </Card>
    </div>
  );
}
