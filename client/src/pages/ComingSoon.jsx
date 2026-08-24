import { useLocation } from 'react-router-dom';
import Button from '../components/ui/Button';
import StatusPill from '../components/ui/StatusPill';

export default function ComingSoon() {
  const { pathname } = useLocation();

  return (
    <div className="flex flex-col items-start gap-3 rounded-card border border-border bg-surface p-6 sm:p-10">
      <StatusPill tone="danger">Not built yet</StatusPill>
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Nothing is registered at this address</h1>
      <p className="max-w-[60ch] text-sm leading-relaxed text-fg-muted">
        <span className="font-mono" dir="ltr">{pathname}</span> is outside what's built so far — discovery
        (home, search, tour, property, wishlist, profile) and identity (role, register, login, OTP, KYC).
      </p>
      <Button to="/discover/home" className="mt-2">
        Back to Discover
      </Button>
    </div>
  );
}
