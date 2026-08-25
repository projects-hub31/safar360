import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { landmarkById } from '../../data/ai/landmarks';
import { useAi } from '../../context/ai/useAi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';
import Toggle from '../../components/ui/Toggle';
import EmptyState from '../../components/ui/EmptyState';

// §3 geofence permission — exactly 4 states, `prompt`/`granted`/`denied`/
// `unavailable`. This deliberately does NOT call the real browser
// geolocation/permissions API — that would pop a real native Chrome
// permission dialog, which (like a JS `alert()`) blocks automated
// interaction and isn't something this app can honestly promise anyway
// without a real GPS signal behind it. Every other "thing a real
// gateway/webhook/sensor would provide" in this app is an explicit,
// honestly-labeled simulation (BookingContext.forceOutcome,
// ShopContext.advanceFulfilment) — this follows the same pattern.
export default function Geofence() {
  const { landmarkId } = useParams();
  const navigate = useNavigate();
  const { geofence, setGeofenceState, checkIns, checkIn } = useAi();
  const landmark = landmarkById(landmarkId);
  const [notifyContact, setNotifyContact] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState(false);

  if (!landmark) {
    return <EmptyState title="Landmark not found" body="Check in from a real landmark page instead." actionLabel="Back to map" actionTo="/ai/map" />;
  }

  const state = geofence[landmarkId] || 'prompt';
  const checkedIn = checkIns[landmarkId];

  const onCheckIn = () => {
    checkIn(landmarkId, { notifyContact });
    setJustCheckedIn(true);
  };

  return (
    <div className="mx-auto flex max-w-[480px] flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Check in — {landmark.name}</h1>
        <p className="text-sm text-fg-muted">Check-in is only offered near this mapped point, and is never posted publicly.</p>
      </div>

      {state === 'prompt' && (
        <Card className="flex flex-col gap-3 p-4 sm:p-5">
          <StatusPill tone="info">Location permission — prompt</StatusPill>
          <p className="text-sm leading-relaxed text-fg-muted">
            Safar360 would like to check your location near {landmark.name} to offer a check-in. This is a
            simulation of that device prompt — no real location is read by this demo.
          </p>
          <div className="flex gap-2">
            <Button fullWidth onClick={() => setGeofenceState(landmarkId, 'granted')}>Allow (simulate)</Button>
            <Button variant="secondary" fullWidth onClick={() => setGeofenceState(landmarkId, 'denied')}>Deny (simulate)</Button>
          </div>
          <Button variant="tertiary" size="sm" className="w-fit" onClick={() => setGeofenceState(landmarkId, 'unavailable')}>
            Simulate no signal instead
          </Button>
        </Card>
      )}

      {state === 'denied' && (
        <Card className="flex flex-col gap-3 p-4 sm:p-5">
          <StatusPill tone="neutral">Location permission — denied</StatusPill>
          <p className="text-sm leading-relaxed text-fg-muted">
            You declined location access. That's a real, respected choice — Safar360 will not automatically ask
            again. Check-in stays unavailable here until you choose to try again yourself.
          </p>
          <Button variant="secondary" fullWidth onClick={() => setGeofenceState(landmarkId, 'prompt')}>Try again</Button>
        </Card>
      )}

      {state === 'unavailable' && (
        <Card className="flex flex-col gap-3 p-4 sm:p-5">
          <StatusPill tone="warning">Location permission — no signal</StatusPill>
          <p className="text-sm leading-relaxed text-fg-muted">
            Check-in is unavailable — we can't confirm you're actually near {landmark.name} without a location
            signal. This is common in the high valleys these tours run through.
          </p>
          <Button variant="secondary" fullWidth onClick={() => setGeofenceState(landmarkId, 'prompt')}>Try again</Button>
        </Card>
      )}

      {state === 'granted' && (
        <Card className="flex flex-col gap-3 p-4 sm:p-5">
          <StatusPill tone="success" icon="✓">Location permission — granted</StatusPill>

          {justCheckedIn || checkedIn ? (
            <>
              <p className="text-sm leading-relaxed text-fg-muted">
                Checked in at {landmark.name}. This marks the matching itinerary stop reached
                {checkedIn?.notifiedContact ? ' and your emergency contact has been notified.' : '.'} Nothing was
                posted publicly — that never happens automatically here.
              </p>
              <Button variant="secondary" fullWidth onClick={() => navigate(`/ai/landmark/${landmarkId}`)}>Back to landmark</Button>
            </>
          ) : (
            <>
              <Toggle
                checked={notifyContact}
                onChange={setNotifyContact}
                label="Notify my emergency contact"
                description="Optional. Sends a check-in notice only to the contact on your profile — never posted publicly."
              />
              <Button fullWidth onClick={onCheckIn}>Check in here</Button>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
