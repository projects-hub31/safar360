import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth/useAuth';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

// Doc requirements are read here as static copy; the real system keeps this
// config-dependent per role rather than hardcoded (CLAUDE.md §6, role screen).
const ROLES = [
  { id: 'traveller', label: 'Traveller', blurb: 'Book trips, stays and gear.', docs: 'No documents needed — just a phone number.' },
  { id: 'operator', label: 'Tour operator', blurb: 'List itineraries and take bookings.', docs: 'Needs CNIC and a tourism business registration.' },
  { id: 'transport', label: 'Transport owner', blurb: 'Quote jeeps, coasters and permits.', docs: 'Needs CNIC, a route permit and a vehicle fitness certificate.' },
  { id: 'property', label: 'Hotel or restaurant', blurb: 'Manage rooms, rates and menus.', docs: 'Needs CNIC and a property registration or trade licence.' },
  { id: 'seller', label: 'Gear seller', blurb: 'Ship outdoor gear across Pakistan.', docs: 'Needs CNIC and a business registration or NTN.' },
  { id: 'influencer', label: 'Influencer', blurb: 'Refer trips and run paid collaborations.', docs: 'No documents needed — link your social profile.' },
];

export default function RoleSelect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { chooseRole } = useAuth();
  const [selected, setSelected] = useState(location.state?.role || null);

  const pickedFromTile = ROLES.find((r) => r.id === location.state?.role);

  const onContinue = () => {
    if (!selected) return;
    chooseRole(selected);
    navigate('/identity/register');
  };

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">How will you use safar360?</h1>
        <p className="text-sm leading-relaxed text-fg-muted">
          You can only pick one to start — operators, transport owners, property owners and gear sellers all go
          through identity verification before they can publish.
        </p>
      </div>

      {pickedFromTile && (
        <div className="rounded-xl border border-primary-line bg-primary-soft px-4 py-3 text-sm text-primary-soft-text">
          You came in as <strong>{pickedFromTile.label}</strong>, so that is already selected.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ROLES.map((r) => {
          const active = selected === r.id;
          return (
            <Card
              key={r.id}
              as="button"
              type="button"
              onClick={() => setSelected(r.id)}
              aria-pressed={active}
              className={`flex flex-col items-start gap-2 p-4 text-start ${
                active ? 'border-2 border-primary bg-primary-soft' : 'border-border'
              }`}
            >
              <span className="font-display text-lg font-semibold tracking-tight">{r.label}</span>
              <span className="text-[13px] leading-relaxed text-fg-muted">{r.blurb}</span>
              <span className="mt-auto border-t border-dashed border-border pt-2 text-xs leading-relaxed text-fg-subtle">
                {r.docs}
              </span>
            </Card>
          );
        })}
      </div>

      <Button onClick={onContinue} disabled={!selected} size="lg">
        Continue
      </Button>
    </div>
  );
}
