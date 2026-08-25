import { useParams } from 'react-router-dom';
import { useApp } from '../../context/app/useApp';
import { useBooking } from '../../context/booking/useBooking';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';
import EmptyState from '../../components/ui/EmptyState';

// The link a non-account participant opens to pay their share of a group
// split — no sign-in required (§6 booking/participant).
export default function Participant() {
  const { groupId, index } = useParams();
  const { formatMoney } = useApp();
  const { groups, payShare } = useBooking();

  const group = groups.find((g) => g.id === groupId);
  const i = Number(index);
  const person = group?.participants?.[i];

  if (!group || !person) {
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
      <StatusPill tone={person.status === 'paid' ? 'success' : 'warning'}>{person.status}</StatusPill>
      <p className="text-xs leading-relaxed text-fg-muted">
        You don't need a safar360 account to pay your share. If not everyone pays before the window closes, this
        is refunded automatically.
      </p>
      {person.status === 'unpaid' && group.status === 'open' && (
        <Button onClick={() => payShare(groupId, i)} fullWidth>Pay {formatMoney(group.price)}</Button>
      )}
      {person.status === 'paid' && (
        <p className="text-sm font-semibold text-success-text">Paid — you'll hear from the organiser once everyone's in.</p>
      )}
    </Card>
  );
}
