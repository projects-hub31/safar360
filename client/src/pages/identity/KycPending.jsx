import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth/useAuth';
import Card from '../../components/ui/Card';
import StatusPill from '../../components/ui/StatusPill';

const ALLOWED = ['Build and save listing drafts', 'Set availability and pricing', 'Choose or change your plan'];
const BLOCKED = ['Publish a listing', 'Receive bookings'];
const POLL_MS = 5000;

export default function KycPending() {
  const navigate = useNavigate();
  const { user, setKycStatus, refreshUser } = useAuth();
  const isOperator = user?.role === 'operator';
  const settled = useRef(false);

  // Real path: this is a genuine `pending` server state now, with no cron/
  // admin console to push a decision to the client — poll for it, the same
  // "check on read" shape every other lazily-settled state in this app uses
  // (subscription grace timers, a lapsed request-to-book window). Not as
  // aggressive as a payment poll (§3's 24h SLA isn't seconds-sensitive).
  useEffect(() => {
    if (!isOperator) return undefined;
    settled.current = false;
    const poll = setInterval(async () => {
      if (settled.current) return;
      const res = await refreshUser();
      if (!res.ok || res.user.kycStatus === 'pending' || settled.current) return;
      settled.current = true;
      clearInterval(poll);
      navigate(res.user.kycStatus === 'approved' ? '/identity/kyc-approved' : '/identity/kyc-rejected');
    }, POLL_MS);
    return () => clearInterval(poll);
  }, [isOperator, refreshUser, navigate]);

  const preview = (status, reason) => {
    setKycStatus(status, reason);
    navigate(status === 'approved' ? '/identity/kyc-approved' : '/identity/kyc-rejected');
  };

  return (
    <div className="mx-auto flex max-w-[520px] flex-col gap-4">
      <Card className="flex flex-col items-start gap-3 p-5 sm:p-6">
        <StatusPill tone="warning">Under review</StatusPill>
        <span className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
          We're reviewing your documents
        </span>
        <p className="text-sm leading-relaxed text-fg-muted">
          Usually within 24 hours. We'll notify you the moment a reviewer makes a decision — nothing here is stuck.
        </p>
      </Card>

      <Card className="flex flex-col gap-3 p-5 sm:p-6">
        <span className="text-sm font-bold">While you wait</span>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-success-text">Allowed now</span>
          {ALLOWED.map((a) => (
            <span key={a} className="flex items-start gap-2 text-sm text-fg-muted">
              <span aria-hidden="true" className="text-success-text">✓</span>
              {a}
            </span>
          ))}
        </div>
        <div className="flex flex-col gap-1.5 border-t border-border pt-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-danger-text">Blocked until approved</span>
          {BLOCKED.map((b) => (
            <span key={b} className="flex items-start gap-2 text-sm text-fg-muted">
              <span aria-hidden="true" className="text-danger-text">✕</span>
              {b}
            </span>
          ))}
        </div>
      </Card>

      {isOperator ? (
        <p className="text-center text-xs leading-relaxed text-fg-muted">
          This page checks for a decision every few seconds. Your documents are real and genuinely under
          review — there's no admin console screen yet to decide from in this environment, so nothing here
          fakes an outcome; a real decision only ever comes from a reviewer's own action
          (<code className="font-mono">POST /api/vendor/kyc/documents/:id/review</code>).
        </p>
      ) : (
        <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border-loud p-4">
          <span className="font-mono text-[11px] uppercase tracking-wider text-fg-subtle">
            Preview · real review isn't wired up for this role yet
          </span>
          <p className="text-xs leading-relaxed text-fg-muted">
            These jump straight to what each decision looks like, without a real reviewer behind them.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => preview('approved')}
              className="min-h-9 rounded-lg border border-border-loud bg-surface px-3 text-xs font-semibold text-fg"
            >
              If approved
            </button>
            <button
              type="button"
              onClick={() => preview('rejected', 'The registration certificate photo is too blurry to read the expiry date.')}
              className="min-h-9 rounded-lg border border-border-loud bg-surface px-3 text-xs font-semibold text-fg"
            >
              If rejected
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
