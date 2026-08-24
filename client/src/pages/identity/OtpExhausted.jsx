import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Countdown from '../../components/ui/Countdown';

const LOCKOUT_SECONDS = 15 * 60;

function maskEmail(email) {
  if (!email) return 'a•••a@gmail.com';
  const [user, domain] = email.split('@');
  if (!domain) return 'a•••a@gmail.com';
  const masked = user.length <= 2 ? user : `${user[0]}•••${user[user.length - 1]}`;
  return `${masked}@${domain}`;
}

export default function OtpExhausted() {
  const navigate = useNavigate();
  const { pending, resendOtp } = useAuth();
  const [unlocked, setUnlocked] = useState(false);

  const tryAgain = () => {
    resendOtp();
    navigate('/identity/otp');
  };

  const emailFallback = () => {
    resendOtp();
    navigate('/identity/otp');
  };

  return (
    <Card className="mx-auto flex max-w-[440px] flex-col items-start gap-4 p-5 sm:p-6">
      <span className="font-display text-xl font-semibold tracking-tight sm:text-2xl">Too many attempts</span>
      <p className="text-sm leading-relaxed text-fg-muted">
        This number is locked for security. You can try again once the clock below runs out, or skip straight to an
        email code.
      </p>

      <div className="flex items-center gap-2 rounded-xl border border-border bg-sunken px-4 py-3">
        <span className="text-sm text-fg-muted">{unlocked ? 'Unlocked' : 'Unlocks in'}</span>
        {!unlocked && <Countdown seconds={LOCKOUT_SECONDS} urgentAt={60} onExpire={() => setUnlocked(true)} />}
      </div>

      <Button onClick={tryAgain} disabled={!unlocked} fullWidth>
        Try again
      </Button>

      <div className="w-full border-t border-border pt-4">
        <p className="mb-2 text-sm leading-relaxed text-fg-muted">
          If your SMS provider is having trouble, we can send a code to your email instead — no need to wait.
        </p>
        <Button variant="secondary" onClick={emailFallback} fullWidth>
          Send code to {maskEmail(pending?.email)}
        </Button>
      </div>
    </Card>
  );
}
