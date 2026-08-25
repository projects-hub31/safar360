import { useLocation } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';

// Same one-shared-branch-template pattern as booking/Outcome.jsx (§6) —
// gear's payment/webhook machine is the same shared one (§3), so it earns
// the same shell rather than four near-duplicate screens.
const CONFIG = {
  expired: {
    tone: 'neutral', pill: 'Session timed out',
    title: 'Your checkout session timed out',
    body: 'Unlike a tour hold, gear checkout never reserved your stock — nothing was released because nothing was ever taken. Your cart is exactly as you left it.',
  },
  failed: {
    tone: 'danger', pill: 'Payment failed',
    title: 'Payment failed',
    body: 'Nothing was charged. Your cart is untouched, so you can try again with a different method.',
  },
  held: {
    tone: 'held', pill: 'Held for review',
    title: 'Payment held for review',
    body: 'Nothing was charged yet. A person reviews this within the hour — you will get an SMS with the outcome either way.',
  },
  'sold-out': {
    tone: 'danger', pill: 'Sold out',
    title: 'Someone got there first',
    body: 'Stock for at least one item ran out moments before your payment cleared. Refunded automatically for that line — we never oversell an item that has actually gone.',
  },
};

export default function Outcome({ kind }) {
  const location = useLocation();
  const cfg = CONFIG[kind] || CONFIG.failed;
  const reason = location.state?.reason;

  return (
    <Card className="mx-auto flex max-w-[480px] flex-col items-start gap-4 p-5 sm:p-6">
      <StatusPill tone={cfg.tone}>{cfg.pill}</StatusPill>
      <span className="font-display text-xl font-semibold tracking-tight sm:text-2xl">{cfg.title}</span>
      <p className="text-sm leading-relaxed text-fg-muted">{reason || cfg.body}</p>
      <div className="flex w-full gap-2">
        <Button to="/shop/cart" fullWidth>Back to cart</Button>
        <Button to="/shop/catalog" variant="secondary" fullWidth>Keep shopping</Button>
      </div>
    </Card>
  );
}
