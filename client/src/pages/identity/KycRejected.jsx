import { useAuth } from '../../context/useAuth';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';

export default function KycRejected() {
  const { user } = useAuth();
  const reason = user?.kycReason || 'The registration certificate photo is too blurry to read the expiry date.';

  return (
    <Card className="mx-auto flex max-w-[480px] flex-col items-start gap-4 p-5 sm:p-6">
      <StatusPill tone="danger" icon="✕">Rejected</StatusPill>
      <span className="font-display text-xl font-semibold tracking-tight sm:text-2xl">One document needs another look</span>
      <div className="w-full rounded-xl border border-danger bg-danger-soft p-3.5 text-sm leading-relaxed text-danger-text">
        {reason}
      </div>
      <p className="text-sm leading-relaxed text-fg-muted">
        You only need to resubmit the document above — not start over. Everything else you already sent stays on
        file.
      </p>
      <Button to="/identity/kyc" fullWidth>
        Resubmit that document
      </Button>
    </Card>
  );
}
