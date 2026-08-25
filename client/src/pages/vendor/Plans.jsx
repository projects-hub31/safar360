import { useNavigate } from 'react-router-dom';
import { useVendor } from '../../context/vendor/useVendor';
import { PLANS } from '../../context/vendor/vendor-context';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ChoiceCard from '../../components/ui/ChoiceCard';
import StatusPill from '../../components/ui/StatusPill';

const STATES = [
  { id: 'active', tone: 'success', body: 'Everything works. Billing renews automatically.' },
  { id: 'past_due', tone: 'warning', body: 'A charge failed today. We retry twice over the next three days before anything changes for you.' },
  { id: 'grace', tone: 'warning', body: 'Retries are exhausted. You have 3 days to update payment before listings are hidden. Nothing is deleted.' },
  { id: 'suspended', tone: 'danger', body: "Listings are hidden from search, not deleted. Pay to restore publishing." },
  { id: 'cancelled', tone: 'neutral', body: 'Listings stay live until your paid period ends, then hide. Data kept 90 days.' },
];

const PERMS = {
  active: { publish: true, bookings: true, payouts: true, search: true },
  past_due: { publish: true, bookings: true, payouts: true, search: true },
  grace: { publish: true, bookings: true, payouts: true, search: true },
  suspended: { publish: false, bookings: false, payouts: false, search: false },
  cancelled: { publish: false, bookings: false, payouts: false, search: false },
};

export default function Plans() {
  const navigate = useNavigate();
  const { subscription } = useVendor();

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Plans</h1>
        <p className="text-sm text-fg-muted">
          Commission is plan-driven — the more you commit monthly, the less we take per booking.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {PLANS.map((p) => (
          <ChoiceCard
            key={p.id}
            active={subscription.plan === p.id}
            onClick={() => navigate('/vendor/subscribe', { state: { plan: p.id } })}
            title={p.name}
            subtitle={`${p.listingCap === Infinity ? 'Unlimited' : p.listingCap} listings · ${p.commissionPct}% commission`}
            meta={`Rs ${p.price.toLocaleString('en-US')}/mo`}
          />
        ))}
      </div>

      <Card className="flex flex-col gap-3 p-4 sm:p-5">
        <strong className="text-sm">Subscription states</strong>
        <p className="-mt-1.5 text-xs leading-relaxed text-fg-muted">
          Current: <StatusPill tone={STATES.find((s) => s.id === subscription.state)?.tone || 'neutral'}>{subscription.state || 'not started'}</StatusPill>
        </p>
        {STATES.map((s) => {
          const perms = PERMS[s.id];
          return (
            <div key={s.id} className="flex flex-col gap-1.5 border-t border-border pt-3 first:border-0 first:pt-0">
              <div className="flex items-center gap-2">
                <StatusPill tone={s.tone}>{s.id}</StatusPill>
              </div>
              <p className="text-xs leading-relaxed text-fg-muted">{s.body}</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(perms).map(([k, v]) => (
                  <span key={k} className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${v ? 'border-success bg-success-soft text-success-text' : 'border-border-loud bg-sunken text-fg-subtle'}`}>
                    {v ? '✓' : '✕'} {k}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </Card>

      {subscription.state && (
        <Button to="/vendor/dashboard" variant="secondary">Back to dashboard</Button>
      )}
    </div>
  );
}
