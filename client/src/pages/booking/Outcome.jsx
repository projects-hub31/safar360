import { useLocation } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';

// One shared template for every non-happy-path branch of the payment state
// machine — the wireframe itself treats these as one "branch" component
// keyed by kind (CLAUDE.md §6), so a screen per branch would just be the same
// shell six times with different copy.
const CONFIG = {
  expired: {
    tone: 'neutral', pill: 'Hold expired',
    title: 'Your hold expired',
    body: 'Ten minutes ran out before payment completed. Nothing was charged, and the seats went straight back to the public pool.',
  },
  failed: {
    tone: 'danger', pill: 'Payment failed',
    title: 'Payment failed',
    body: 'Nothing was charged. Your hold was released so you can try again with a different method.',
  },
  held: {
    tone: 'held', pill: 'Held for review',
    title: 'Payment held for review',
    body: 'Nothing was charged yet. A person reviews this within the hour — you will get an SMS with the outcome either way.',
  },
  'sold-out': {
    tone: 'danger', pill: 'Sold out',
    title: 'Someone got there first',
    body: 'The last seat was captured moments before you. Refunded automatically — we never overbook a seat that has actually gone.',
  },
  late: {
    tone: 'danger', pill: 'Refunded',
    title: 'Late webhook — refunded',
    body: 'Your payment arrived after your hold expired. Refunded automatically rather than overbooking the slot.',
  },
  declined: {
    tone: 'warning', pill: 'Declined',
    title: 'The operator declined this request',
    body: 'A request-to-book never holds a seat, so nothing was charged. Full refund if anything was pre-paid.',
  },
};

export default function Outcome({ kind }) {
  const location = useLocation();
  const cfg = CONFIG[kind] || CONFIG.failed;
  const { reason, ref, tourId, title } = location.state || {};

  return (
    <Card className="mx-auto flex max-w-[480px] flex-col items-start gap-4 p-5 sm:p-6">
      <StatusPill tone={cfg.tone}>{cfg.pill}</StatusPill>
      <span className="font-display text-xl font-semibold tracking-tight sm:text-2xl">{cfg.title}</span>
      {title && <p className="-mt-2 text-sm text-fg-muted">{title}</p>}
      <p className="text-sm leading-relaxed text-fg-muted">{reason || cfg.body}</p>
      {ref && (
        <span dir="ltr" className="rounded-lg border border-border bg-sunken px-3 py-1.5 font-mono text-xs">
          {ref}
        </span>
      )}
      <div className="flex w-full gap-2">
        {tourId ? (
          <Button to={`/discover/tour/${tourId}`} fullWidth>Try again</Button>
        ) : (
          <Button to="/discover/search" fullWidth>Browse trips</Button>
        )}
        <Button to="/booking/history" variant="secondary" fullWidth>Bookings</Button>
      </div>
    </Card>
  );
}
