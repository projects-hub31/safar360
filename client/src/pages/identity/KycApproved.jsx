import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';

const EFFECTS = [
  'Every draft listing can publish now',
  'Your payout ledger moves from accruing to pending on the next batch',
  'A verified badge appears on your listings',
];

export default function KycApproved() {
  return (
    <Card className="mx-auto flex max-w-[480px] flex-col items-start gap-4 p-5 sm:p-6">
      <StatusPill tone="success" icon="✓">Approved</StatusPill>
      <span className="font-display text-xl font-semibold tracking-tight sm:text-2xl">You're verified</span>
      <p className="text-sm leading-relaxed text-fg-muted">
        Your documents cleared review. Here's what changes right away:
      </p>
      <div className="flex flex-col gap-1.5">
        {EFFECTS.map((e) => (
          <span key={e} className="flex items-start gap-2 text-sm text-fg-muted">
            <span aria-hidden="true" className="text-success-text">✓</span>
            {e}
          </span>
        ))}
      </div>
      <p className="text-xs leading-relaxed text-fg-subtle">
        Re-verification only triggers when a document expires — never on a fixed timer.
      </p>
      <Button to="/discover/home" fullWidth>
        Continue
      </Button>
    </Card>
  );
}
