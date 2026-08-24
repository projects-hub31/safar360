import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/useApp';
import { useBooking } from '../../context/useBooking';
import { GROUP_WINDOW_HOURS } from '../../context/booking-context';
import { TOURS } from '../../data/traveler/tours';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import StatusPill from '../../components/ui/StatusPill';
import Countdown from '../../components/ui/Countdown';

const PILL = { paid: 'success', unpaid: 'warning', declined: 'danger' };

function NewGroupForm({ seed, onCreate }) {
  const [names, setNames] = useState(['You', '', '']);
  const setName = (i, v) => setNames((ns) => ns.map((n, idx) => (idx === i ? v : n)));
  const addRow = () => setNames((ns) => ns.concat(''));
  const ready = names.filter((n) => n.trim()).length >= 2;

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
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={addRow}>Add another</Button>
        <Button
          size="sm"
          disabled={!ready}
          onClick={() => onCreate(names.filter((n) => n.trim()))}
        >
          Start the split
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

  const seedTour = TOURS.find((t) => t.id === location.state?.tourId) || TOURS[0];
  const seed = {
    tourId: location.state?.tourId || seedTour.id,
    title: location.state?.title || seedTour.title,
    price: location.state?.price || seedTour.price,
  };

  if (!group) {
    return (
      <NewGroupForm
        seed={seed}
        onCreate={(names) => setActiveGroupId(startGroupSplit({ ...seed, participantNames: names }))}
      />
    );
  }

  const paidCount = group.participants.filter((p) => p.status === 'paid').length;
  const total = group.price * group.participants.length;
  const shortfall = (group.participants.length - paidCount) * group.price;

  return (
    <div className="mx-auto flex max-w-[520px] flex-col gap-4">
      <Card className="flex flex-col gap-3 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="font-display text-lg font-semibold tracking-tight">{group.title}</span>
          {group.status === 'open' && (
            <Countdown key={group.id} seconds={GROUP_WINDOW_HOURS * 3600} urgentAt={3600} onExpire={() => lapseGroup(group.id)} />
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
            The 24-hour window closed with {group.participants.length - paidCount} unpaid. Everyone who did pay
            has been refunded in full.
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-2 p-4 sm:p-5">
        <strong className="mb-1 text-sm">Participants</strong>
        {group.participants.map((p, i) => (
          <div key={i} className="flex flex-col gap-1.5 border-t border-border py-2 first:border-0 first:pt-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">{p.name}</span>
              <div className="flex items-center gap-2">
                <StatusPill tone={PILL[p.status] || 'neutral'}>{p.status}</StatusPill>
                {group.status === 'open' && p.status === 'unpaid' && i === 0 && (
                  <Button size="sm" onClick={() => payShare(group.id, i)}>Pay my share</Button>
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
