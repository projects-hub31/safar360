import { useAuth } from '../../context/auth/useAuth';
import { useVendor } from '../../context/vendor/useVendor';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';

function Row({ ok, label }) {
  return (
    <div className="flex items-center gap-2.5 border-t border-border py-2 text-sm first:border-0 first:pt-0">
      <StatusPill tone={ok ? 'success' : 'danger'}>{ok ? 'OK' : 'Blocked'}</StatusPill>
      <span>{label}</span>
    </div>
  );
}

export default function Gate() {
  const { user } = useAuth();
  const { subscription, listings } = useVendor();

  const kycApproved = user?.kycStatus === 'approved';
  const subOk = subscription.state === 'active' || subscription.state === 'grace';
  const anyDraftReady = listings.some((l) => l.photos.length >= 3 && l.price > 0 && l.departures.length >= 1);

  const gateOk = kycApproved && subOk;

  return (
    <div className="mx-auto flex max-w-[560px] flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Publish gate</h1>
      <p className="text-sm leading-relaxed text-fg-muted">
        Every listing must clear the same formula before it can go live. Two conditions live at the account
        level (checked once, apply to every listing); three live per-listing.
      </p>

      <Card className="flex flex-col p-4 sm:p-5">
        <span className="mb-1 text-xs font-semibold uppercase tracking-wider text-fg-subtle">Account-level</span>
        <Row ok={kycApproved} label={`Identity verification (KYC) approved — currently ${user?.kycStatus || 'not started'}`} />
        <Row ok={subOk} label={`Subscription active or in grace — currently ${subscription.state || 'not started'}`} />
      </Card>

      <Card className="flex flex-col p-4 sm:p-5">
        <span className="mb-1 text-xs font-semibold uppercase tracking-wider text-fg-subtle">Per-listing</span>
        <Row ok label="At least 3 photos" />
        <Row ok label="A price per person greater than zero" />
        <Row ok label="At least one departure added in Availability" />
        <span className="pt-2 text-xs text-fg-subtle">These three are checked against each individual listing at Review — shown generically here since the formula never changes.</span>
      </Card>

      <Card className={`flex items-center justify-between gap-3 p-4 ${gateOk ? 'border-success' : 'border-warning'}`}>
        <span className="text-sm">
          {gateOk
            ? anyDraftReady
              ? 'Account gate is open and at least one draft already clears the per-listing checks.'
              : 'Account gate is open — finish a listing’s photos, price, and availability to publish it.'
            : 'Account gate is blocked — no listing can publish until both conditions above are met.'}
        </span>
        <StatusPill tone={gateOk ? 'success' : 'warning'}>{gateOk ? 'Open' : 'Blocked'}</StatusPill>
      </Card>

      <div className="flex flex-wrap gap-2">
        {!kycApproved && <Button to="/identity/kyc" variant="secondary">Go to KYC</Button>}
        {!subOk && <Button to="/vendor/plans" variant="secondary">Choose a plan</Button>}
        <Button to="/vendor/listings">My listings</Button>
      </div>
    </div>
  );
}
