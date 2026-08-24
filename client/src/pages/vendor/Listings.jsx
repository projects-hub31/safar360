import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useVendor } from '../../context/useVendor';
import { useApp } from '../../context/useApp';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import SelectField from '../../components/ui/SelectField';
import ChoiceCard from '../../components/ui/ChoiceCard';
import StatusPill from '../../components/ui/StatusPill';
import EmptyState from '../../components/ui/EmptyState';

const STEPS = ['Basics', 'Photos', 'Policy', 'Review'];
const REGIONS = ['Gilgit-Baltistan', 'Khyber Pakhtunkhwa', 'Balochistan'];
const MIN_DESC = 120;

const MODES = [
  { id: 'instant', title: 'Instant booking', subtitle: 'Travellers book and pay immediately. Seats deduct the moment payment confirms.' },
  { id: 'request', title: 'Request to book', subtitle: 'You get 24 hours to accept. Seats are only deducted when you say yes.' },
];
const POLICIES = [
  { id: 'flexible', title: 'Flexible', subtitle: 'Full refund until 24 hours before departure.' },
  { id: 'standard', title: 'Standard', subtitle: '100% at 7 days, 50% at 48 hours, nothing after.' },
  { id: 'strict', title: 'Strict', subtitle: '50% until 14 days before. For permit-heavy treks.' },
];

const PILL = { draft: 'neutral', published: 'success' };

function Wizard({ listing, onDone }) {
  const { updateListing, addPhoto, removePhoto, setCoverPhoto, publishListing } = useVendor();
  const { user } = useAuth();
  const { subscription } = useVendor();
  const { formatMoney } = useApp();
  const [step, setStep] = useState(0);

  const gateOk = { kycApproved: user?.kycStatus === 'approved', subOk: subscription.state === 'active' || subscription.state === 'grace' };

  const set = (patch) => updateListing(listing.id, patch);
  const descOk = listing.description.trim().length >= MIN_DESC;

  const onPublish = () => {
    const result = publishListing(listing.id, gateOk);
    if (result.ok) onDone();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 flex-col gap-1.5">
            <div className={`h-1.5 rounded-full ${i <= step ? 'bg-primary' : 'bg-border'}`} />
            <span className={`text-xs font-semibold ${i === step ? 'text-fg' : 'text-fg-subtle'}`}>{s}</span>
          </div>
        ))}
      </div>

      <Card className="flex flex-col gap-4 p-4 sm:p-5">
        {step === 0 && (
          <>
            <TextField label="Listing title" value={listing.title} onChange={(e) => set({ title: e.target.value })} placeholder="Hunza & Attabad Lake — 5 days" />
            <div className="flex flex-col gap-1">
              <label className="text-[12.5px] font-bold text-fg" htmlFor="ls-desc">Description</label>
              <textarea
                id="ls-desc"
                value={listing.description}
                onChange={(e) => set({ description: e.target.value })}
                rows={5}
                className="w-full rounded-lg border border-border-strong bg-raised p-3 text-[15px] text-fg"
              />
              <span className={`text-xs ${descOk ? 'text-fg-muted' : 'text-danger-text'}`}>
                {listing.description.trim().length} / {MIN_DESC} characters minimum
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Days" type="number" min={1} max={30} value={listing.days} onChange={(e) => set({ days: Number(e.target.value) })} />
              <TextField label="Price per person (Rs)" type="number" min={0} step={500} value={listing.price} onChange={(e) => set({ price: Number(e.target.value) })} />
            </div>
            <SelectField label="Region" value={listing.region} onChange={(e) => set({ region: e.target.value })} options={REGIONS.map((r) => ({ value: r, label: r }))} />
            {listing.price > 0 && (
              <p className="text-xs text-fg-subtle">
                What you keep: {formatMoney(listing.price)} − commission = roughly {formatMoney(Math.round(listing.price * 0.88))} per person on the Growth plan.
              </p>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <p className="text-xs leading-relaxed text-fg-muted">
              Landscape, at least 1200px wide. The cover is what travellers see in search — make it the view, not
              your logo. Minimum 3 to publish.
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {listing.photos.map((p) => (
                <div key={p.id} className="flex flex-col gap-1.5 rounded-lg border border-border-strong bg-sunken p-2">
                  <div className="grid aspect-[4/3] place-items-center rounded-md bg-ink-200 text-xs text-fg-subtle">{p.name}</div>
                  <div className="flex items-center justify-between gap-1">
                    {p.cover ? (
                      <StatusPill tone="accent">Cover</StatusPill>
                    ) : (
                      <button type="button" onClick={() => setCoverPhoto(listing.id, p.id)} className="text-[11px] font-semibold text-primary-soft-text">Make cover</button>
                    )}
                    <button type="button" onClick={() => removePhoto(listing.id, p.id)} aria-label="Remove photo" className="text-[11px] text-danger-text">✕</button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addPhoto(listing.id)}
                className="grid aspect-[4/3] place-items-center rounded-lg border border-dashed border-border-loud text-xs font-semibold text-fg-muted"
              >
                + Add photo
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <span className="text-[12.5px] font-bold">Booking mode</span>
            <div className="flex flex-col gap-2">
              {MODES.map((m) => (
                <ChoiceCard key={m.id} active={listing.bookingMode === m.id} onClick={() => set({ bookingMode: m.id })} title={m.title} subtitle={m.subtitle} />
              ))}
            </div>
            <span className="mt-2 text-[12.5px] font-bold">Cancellation policy</span>
            <div className="flex flex-col gap-2">
              {POLICIES.map((p) => (
                <ChoiceCard key={p.id} active={listing.cancellationPolicy === p.id} onClick={() => set({ cancellationPolicy: p.id })} title={p.title} subtitle={p.subtitle} />
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="grid grid-cols-2 gap-2.5 text-sm">
              <span className="text-fg-muted">Title</span><span className="text-end font-semibold">{listing.title || '—'}</span>
              <span className="text-fg-muted">Price</span><span className="text-end font-mono">{formatMoney(listing.price)}</span>
              <span className="text-fg-muted">Photos</span><span className="text-end font-mono">{listing.photos.length}</span>
              <span className="text-fg-muted">Departures</span><span className="text-end font-mono">{listing.departures.length}</span>
            </div>
            <div className="flex flex-col gap-1.5 border-t border-border pt-3">
              {publishListingBlockers(listing, gateOk).map((b) => (
                <span key={b} className="flex items-start gap-1.5 text-xs text-danger-text">
                  <span aria-hidden="true">✕</span>{b}
                </span>
              ))}
              {publishListingBlockers(listing, gateOk).length === 0 && (
                <span className="flex items-center gap-1.5 text-xs text-success-text"><span aria-hidden="true">✓</span>Ready to publish</span>
              )}
            </div>
            {listing.departures.length < 1 && (
              <Button to="/vendor/availability" variant="secondary" size="sm" className="w-fit">Add availability</Button>
            )}
          </>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-border pt-3.5">
          <span className="font-mono text-[11px] text-fg-subtle">Autosaved</span>
          <div className="flex gap-2">
            {step > 0 && <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>Back</Button>}
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={step === 0 && (!listing.title.trim() || !descOk)}>Next</Button>
            ) : (
              <Button onClick={onPublish} disabled={publishListingBlockers(listing, gateOk).length > 0}>Publish</Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

// Mirrors VendorContext.publishGate's exact rule set for live display —
// duplicated as a pure read-only check here so Review can re-evaluate on
// every render without calling the mutating publishListing().
function publishListingBlockers(listing, { kycApproved, subOk }) {
  const blockers = [];
  if (!kycApproved) blockers.push('Identity verification (KYC) is not approved yet');
  if (!subOk) blockers.push('Your subscription needs to be active or in its grace period');
  if (listing.photos.length < 3) blockers.push(`Add ${3 - listing.photos.length} more photo${3 - listing.photos.length === 1 ? '' : 's'} (3 minimum)`);
  if (!(listing.price > 0)) blockers.push('Set a price per person');
  if (listing.departures.length < 1) blockers.push('Add at least one departure in Availability');
  return blockers;
}

export default function Listings() {
  const navigate = useNavigate();
  const { listings, createDraftListing } = useVendor();
  const { formatMoney } = useApp();
  const [editingId, setEditingId] = useState(null);

  const editing = listings.find((l) => l.id === editingId);

  if (editing) {
    return <Wizard listing={editing} onDone={() => setEditingId(null)} />;
  }

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">My listings</h1>
        <Button onClick={() => setEditingId(createDraftListing())}>New listing</Button>
      </div>

      {listings.length ? (
        <div className="flex flex-col gap-2.5">
          {listings.map((l) => (
            <Card key={l.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-bold">{l.title || 'Untitled listing'}</span>
                <span className="text-xs text-fg-muted">{l.region} · {l.days} days · {l.photos.length} photos</span>
              </div>
              <span className="font-mono text-sm font-semibold">{formatMoney(l.price)}</span>
              <StatusPill tone={PILL[l.status]}>{l.status}</StatusPill>
              <Button size="sm" variant="secondary" onClick={() => setEditingId(l.id)}>Edit</Button>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nothing listed yet"
          body="Build your first listing — the wizard autosaves as you go, and nothing publishes until every gate is clear."
          actionLabel="New listing"
          onAction={() => setEditingId(createDraftListing())}
        />
      )}

      <Button to="/vendor/dashboard" variant="tertiary" size="sm" className="w-fit" onClick={() => navigate('/vendor/dashboard')}>
        Back to dashboard
      </Button>
    </div>
  );
}
