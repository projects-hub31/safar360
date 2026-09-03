import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../../context/app/useApp';
import { useBooking } from '../../context/booking/useBooking';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';
import EmptyState from '../../components/ui/EmptyState';

// The link a non-account participant opens to pay their share of a group
// split — no sign-in required (§6 booking/participant). A participant may be
// opening this on a fresh browser/device with nothing in local context state
// (they never created the split), so this always fetches the real,
// server-authoritative group directly rather than assuming the organizer's
// `groups` cache already has it (CLAUDE.md §2 law: the server is the truth).
function ParticipantView({ groupId, index }) {
  const { formatMoney } = useApp();
  const { groups, fetchGroup, payShare } = useBooking();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchGroup(groupId).then((res) => {
      if (cancelled) return;
      setNotFound(!res.ok);
      setLoading(false);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const group = groups.find((g) => g.id === groupId);
  const i = Number(index);
  const person = group?.participants?.[i];

  if (loading) return null;

  if (notFound || !group || !person) {
    return (
      <EmptyState
        title="This link isn't active"
        body="Group-split links only work while the split is open. Ask whoever organised the trip to resend it."
        actionLabel="Go to safar360"
        actionTo="/discover/home"
      />
    );
  }

  return (
    <Card className="mx-auto flex max-w-[420px] flex-col items-start gap-3 p-6">
      <span className="font-mono text-[11px] uppercase tracking-wider text-fg-subtle">Group payment · {group.title}</span>
      <span className="font-display text-xl font-semibold tracking-tight">{person.name}'s share</span>
      <span className="font-mono text-2xl font-semibold">{formatMoney(group.price)}</span>
      <StatusPill tone={person.status === 'paid' ? 'success' : group.status === 'lapsed' ? 'danger' : 'warning'}>
        {group.status === 'lapsed' ? 'closed' : person.status}
      </StatusPill>
      <p className="text-xs leading-relaxed text-fg-muted">
        You don't need a safar360 account to pay your share. If not everyone pays before the window closes, this
        is refunded automatically.
      </p>
      {payError && <p role="alert" className="text-xs leading-relaxed text-danger-text">{payError}</p>}
      {group.status === 'lapsed' && (
        <p className="text-sm leading-relaxed text-danger-text">{group.outcomeReason}</p>
      )}
      {person.status === 'unpaid' && group.status === 'open' && (
        <Button
          fullWidth
          disabled={paying}
          onClick={async () => {
            setPaying(true);
            setPayError(null);
            const res = await payShare(groupId, i);
            setPaying(false);
            if (!res.ok) setPayError(res.message);
          }}
        >
          {paying ? 'Paying…' : `Pay ${formatMoney(group.price)}`}
        </Button>
      )}
      {person.status === 'paid' && group.status !== 'lapsed' && (
        <p className="text-sm font-semibold text-success-text">Paid — you'll hear from the organiser once everyone's in.</p>
      )}
    </Card>
  );
}

// Keyed by groupId+index (same remount-over-effect-reset pattern as
// traveler/TourDetail.jsx's TourDetailView) — a param change on this route
// should start the fetch/loading cycle over, not reuse stale state.
export default function Participant() {
  const { groupId, index } = useParams();
  return <ParticipantView key={`${groupId}-${index}`} groupId={groupId} index={index} />;
}
