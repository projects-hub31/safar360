import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/app/useApp';
import { useBooking } from '../../context/booking/useBooking';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import StatusPill from '../../components/ui/StatusPill';
import Countdown from '../../components/ui/Countdown';
import EmptyState from '../../components/ui/EmptyState';

const PILL = { paid: 'success', unpaid: 'warning', declined: 'danger' };

// Countdown expects a whole-second duration, not an absolute deadline (same
// convention as admin/Kyc.jsx's slaSeconds) — a module-level helper, not an
// inline `Date.now()` in JSX, keeps the component's own render pure.
function secondsUntil(deadlineAt) {
  return Math.max(0, Math.round((deadlineAt - Date.now()) / 1000));
}

function NewGroupForm({ seed, onCreate }) {
  const [names, setNames] = useState(['You', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const setName = (i, v) => setNames((ns) => ns.map((n, idx) => (idx === i ? v : n)));
  const addRow = () => setNames((ns) => ns.concat(''));
  const ready = names.filter((n) => n.trim()).length >= 2;

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    const res = await onCreate(names.filter((n) => n.trim()));
    setSubmitting(false);
    if (!res.ok) setError(res.message || 'Could not start the split. Try again.');
  };

  return (
    <Card className="flex flex-col gap-3 p-5 sm:p-6">
      <strong className="text-sm">Split {seed.title} between a group</strong>
      <p className="-mt-1.5 text-xs leading-relaxed text-fg-muted">
        Everyone pays their own share within 24 hours. If even one person hasn't paid when the window closes,
        everyone who did pay is refunded in full — state that up front, it's the one thing people get wrong here.
      </p>
      {names.map((n, i) => (
        <TextField key={i} label={`Participant ${i + 1}`} value={n} onChange={(e) => setName(i, e.target.value)} disabled={i === 0} />
      ))}
      {error && <p role="alert" className="text-xs leading-relaxed text-danger-text">{error}</p>}
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={addRow}>Add another</Button>
        <Button size="sm" disabled={!ready || submitting} onClick={submit}>
          {submitting ? 'Starting…' : 'Start the split'}
        </Button>
      </div>
    </Card>
  );
}

export default function GroupSplit() {
  const location = useLocation();
  const { formatMoney } = useApp();
  const { groups, startGroupSplit, payShare, lapseGroup } = useBooking();
  const [nudged, setNudged] = useState({});
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);

  // Tracked by id, not re-derived from `groups` each render — once a split
  // is created we keep showing that exact one through open → confirmed/
  // lapsed, rather than "the last group in the array" (which would mean a
  // second split for a different tour could never start once any group had
  // reached a terminal state). A fresh mount only resumes an already-open
  // split for the same tour; anything terminal starts a new form instead.
  const [activeGroupId, setActiveGroupId] = useState(() => {
    const wantTourId = location.state?.tourId;
    const openMatch = groups.find((g) => g.status === 'open' && (!wantTourId || g.tourId === wantTourId));
    return openMatch?.id || null;
  });
  const group = groups.find((g) => g.id === activeGroupId);

  // A real group-split needs a real tour/departure id (server/src/routes/
  // booking/group.routes.js) — TourDetail only surfaces this link once the
  // live tour has loaded, so reaching this screen with none in `state` means
  // a stale bookmark/back-navigation, not a legitimate flow to seed fake data
  // for.
  const seed = {
    tourId: location.state?.tourId,
    departureId: location.state?.departureId,
    title: location.state?.title,
    price: location.state?.price,
  };

  if (!group && !seed.tourId) {
    return (
      <EmptyState
        title="Start a split from a tour page"
        body="Group splits open from a specific trip and departure — go back to the tour you want to split and choose “Split the cost with the group instead.”"
        actionLabel="Browse trips"
        actionTo="/discover/search"
      />
    );
  }

  if (!group) {
    return (
      <NewGroupForm
        seed={seed}
        onCreate={async (names) => {
          const res = await startGroupSplit({ ...seed, participantNames: names });
          if (res.ok) setActiveGroupId(res.id);
          return res;
        }}
      />
    );
  }

  const paidCount = group.participants.filter((p) => p.status === 'paid').length;
  const total = group.total;
  const shortfall = (group.participants.length - paidCount) * group.price;

  return (
    <div className="mx-auto flex max-w-[520px] flex-col gap-4">
      <Card className="flex flex-col gap-3 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="font-display text-lg font-semibold tracking-tight">{group.title}</span>
          {group.status === 'open' && (
            <Countdown
              key={group.id}
              seconds={secondsUntil(group.deadlineAt)}
              urgentAt={3600}
              onExpire={() => lapseGroup(group.id)}
            />
          )}
        </div>
        <span className="text-sm text-fg-muted">
          {paidCount} of {group.participants.length} paid · {formatMoney(total)} total
        </span>
        {group.status === 'open' && shortfall > 0 && (
          <div className="rounded-xl border border-warning bg-warning-soft px-3.5 py-2.5 text-[13px] leading-relaxed text-warning-text">
            {formatMoney(shortfall)} still short. If the window closes before everyone pays, paid amounts are
            refunded — nothing is kept partial.
          </div>
        )}
        {group.status === 'confirmed' && (
          <div className="rounded-xl border border-success bg-success-soft px-3.5 py-2.5 text-[13px] leading-relaxed text-success-text">
            Everyone paid — booking confirmed.{' '}
            <Button to="/booking/history" size="sm" variant="tertiary" className="ml-1 inline-flex">View it</Button>
          </div>
        )}
        {group.status === 'lapsed' && (
          <div className="rounded-xl border border-danger bg-danger-soft px-3.5 py-2.5 text-[13px] leading-relaxed text-danger-text">
            {group.outcomeReason || 'This window has closed. Everyone who paid has been refunded in full.'}
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-2 p-4 sm:p-5">
        <strong className="mb-1 text-sm">Participants</strong>
        {payError && <p role="alert" className="text-xs leading-relaxed text-danger-text">{payError}</p>}
        {group.participants.map((p, i) => (
          <div key={i} className="flex flex-col gap-1.5 border-t border-border py-2 first:border-0 first:pt-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">{p.name}</span>
              <div className="flex items-center gap-2">
                <StatusPill tone={PILL[p.status] || 'neutral'}>{p.status}</StatusPill>
                {group.status === 'open' && p.status === 'unpaid' && i === 0 && (
                  <Button
                    size="sm"
                    disabled={paying}
                    onClick={async () => {
                      setPaying(true);
                      setPayError(null);
                      const res = await payShare(group.id, i);
                      setPaying(false);
                      if (!res.ok) setPayError(res.message);
                    }}
                  >
                    {paying ? 'Paying…' : 'Pay my share'}
                  </Button>
                )}
                {group.status === 'open' && p.status === 'unpaid' && i !== 0 && (
                  <Button size="sm" variant="secondary" disabled={nudged[i]} onClick={() => setNudged((n) => ({ ...n, [i]: true }))}>
                    {nudged[i] ? 'Nudged' : 'Nudge'}
                  </Button>
                )}
              </div>
            </div>
            {group.status === 'open' && p.status === 'unpaid' && i !== 0 && (
              <span dir="ltr" className="font-mono text-[11px] text-fg-subtle">
                safar360.app/#/booking/participant/{group.id}/{i}
              </span>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
