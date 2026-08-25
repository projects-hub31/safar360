import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAi } from '../../context/ai/useAi';
import { useBooking } from '../../context/booking/useBooking';
import { TRACK_BOOKING_REF, TRACK_STATS, TRACK_LEGS } from '../../context/ai/ai-context';
import Card from '../../components/ui/Card';
import StatusPill from '../../components/ui/StatusPill';
import Toggle from '../../components/ui/Toggle';
import EmptyState from '../../components/ui/EmptyState';

const DOT_STYLE = {
  done: 'bg-success',
  'signal-lost': 'bg-warning',
  upcoming: 'bg-border-loud',
};

function formatAge(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

// §6 08-ai `isTracking` — a live in-trip location screen, NOT the same
// concept as `shop/tracking/:ref` (a gear order's courier parcel tracking,
// unrelated and untouched by this screen). Only one booking in this demo
// (`TRACK_BOOKING_REF`, see `ai-context.js`) is genuinely mid-trip, so an
// explicit `:ref` that doesn't match it gets an honest "not trackable" state
// rather than a fabricated live view for an unstarted or finished booking.
export default function Tracking() {
  const { ref } = useParams();
  const { trackShares, toggleTrackShare, trackLastPingAt } = useAi();
  const { bookings } = useBooking();

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setTimeout(() => setNow(Date.now()), 1000);
    return () => clearTimeout(t);
  }, [now]);

  const booking = bookings.find((b) => b.ref === (ref || TRACK_BOOKING_REF));
  const trackable = booking && booking.ref === TRACK_BOOKING_REF && booking.state === 'confirmed';

  if (!trackable) {
    return (
      <EmptyState
        title="Nothing live to track"
        body="Tracking only runs for a booking whose trip is currently underway."
        actionLabel="Booking history"
        actionTo="/booking/history"
      />
    );
  }

  const legs = TRACK_LEGS;
  const signalLost = legs.some((l) => l.dot === 'signal-lost');
  const lastLeg = legs.filter((l) => l.dot !== 'upcoming').slice(-1)[0];
  const ageSeconds = Math.max(0, Math.floor((now - trackLastPingAt) / 1000));

  return (
    <div className="mx-auto grid max-w-[860px] items-start gap-4 sm:grid-cols-[1fr_300px]">
      <Card className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2.5 rounded-lg border border-border bg-raised px-3.5 py-2.5">
          <span aria-hidden="true" className="h-2.5 w-2.5 flex-none animate-pulse rounded-full bg-success" />
          <strong className="text-sm">Live · {booking.title}, day 3</strong>
          <span dir="ltr" className="ml-auto font-mono text-xs text-fg-muted">updated {formatAge(ageSeconds)} ago</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TRACK_STATS(booking).map((s) => (
            <div key={s.k} className="flex flex-col gap-0.5">
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-fg-subtle">{s.k}</span>
              <span dir="ltr" className="font-mono text-[17px] font-bold tabular-nums text-fg">{s.v}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2.5 border-t border-border pt-3.5">
          <strong className="text-sm">Today&rsquo;s route</strong>
          {legs.map((l) => (
            <div key={l.title} className="flex flex-wrap items-center gap-2.5">
              <span aria-hidden="true" className={`h-2.5 w-2.5 flex-none rounded-full ${DOT_STYLE[l.dot]}`} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className={`text-sm font-semibold ${l.dot === 'upcoming' ? 'text-fg-muted' : 'text-fg'}`}>{l.title}</span>
                <span className="text-xs text-fg-muted">{l.detail}</span>
              </span>
              <span dir="ltr" className="flex-none font-mono text-xs text-fg-subtle">{l.at}</span>
            </div>
          ))}
        </div>

        {signalLost && (
          <p className="text-xs leading-relaxed text-fg-muted">
            Past {lastLeg.title} the signal goes. The app keeps the last known point and the time it was
            taken, and says so — it never shows a stale position as if it were current.
          </p>
        )}
      </Card>

      <div className="flex flex-col gap-3.5">
        <Card className="flex flex-col gap-2.5 p-4">
          <strong className="text-sm">Who can see this</strong>
          {trackShares.map((t) => (
            <Toggle key={t.id} checked={t.on} onChange={() => toggleTrackShare(t.id)} label={t.label} description={t.note} />
          ))}
          <p className="text-xs leading-relaxed text-fg-muted">
            Tracking runs only while a booking is active and stops by itself when the trip ends. Nobody at
            safar360 watches where you are between trips.
          </p>
        </Card>
        <StatusPill tone="neutral" className="w-fit">{booking.seats} traveller{booking.seats === 1 ? '' : 's'} on this booking</StatusPill>
      </div>
    </div>
  );
}
