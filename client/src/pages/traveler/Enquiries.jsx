import { useEffect } from 'react';
import { useApp } from '../../context/app/useApp';
import { useTransport } from '../../context/transport/useTransport';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';
import Countdown from '../../components/ui/Countdown';
import EmptyState from '../../components/ui/EmptyState';

function remainingSeconds(deadlineAt) {
  return Math.max(0, Math.round((deadlineAt - Date.now()) / 1000));
}

const KIND_LABEL = { transport: 'Vehicle', table: 'Dinner table', group: 'Group event' };
const STATUS_PILL = {
  request: { tone: 'info', label: 'Awaiting a quote' },
  quoted: { tone: 'warning', label: 'Quoted — needs your reply' },
  accepted: { tone: 'success', label: 'Accepted' },
  declined: { tone: 'danger', label: 'Declined' },
  expired: { tone: 'neutral', label: 'Expired' },
  withdrawn: { tone: 'neutral', label: 'Withdrawn by owner' },
};

// Traveller-facing view of the lead lifecycle (§3): request → quoted →
// accepted | expired | withdrawn. This is where the "quoted → accepted"
// transition actually becomes reachable from the traveller side, closing the
// loop that `discover/transport` and `discover/property`'s enquiry forms
// start (§8 module 05 entry — the earlier build had no traveller-facing
// screen at all for what happens after "Enquiry sent").
export default function Enquiries() {
  const { formatMoney } = useApp();
  const { leads, fetchMyLeads, acceptLead } = useTransport();

  useEffect(() => {
    fetchMyLeads();
    // Runs once on mount — fetchMyLeads is stable (useCallback, no deps).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // leads is already traveller-scoped by the real endpoint
  // (GET /transport/leads/mine) — no local name matching needed.
  const mine = leads.slice().sort((a, b) => b.createdAt - a.createdAt);

  if (!mine.length) {
    return (
      <EmptyState
        title="No enquiries yet"
        body="Ask a transport owner or property for a quote and it will show up here — no vehicle, table or room is ever held until you accept a quote."
        actionLabel="Browse transport"
        actionTo="/discover/transport"
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">My enquiries</h1>
        <p className="text-sm text-fg-muted">
          A lead, not a reservation — no money moves and nothing is held until you accept a quote.
        </p>
      </div>

      {mine.map((l) => {
        const pill = STATUS_PILL[l.status] || STATUS_PILL.request;

        return (
          <Card key={l.id} className="flex flex-col gap-2.5 p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-[15px] font-bold">{l.subjectLabel}</span>
              <StatusPill tone={pill.tone}>{pill.label}</StatusPill>
            </div>
            <span className="text-xs text-fg-muted">{KIND_LABEL[l.kind] || l.kind} · {l.date} · {l.count} {l.kind === 'transport' ? 'passengers' : 'guests'}</span>
            {l.note && <span className="text-xs text-fg-muted">“{l.note}”</span>}

            {l.status === 'request' && (
              <span className="text-xs text-fg-muted">Owner replies within <Countdown key={l.id} seconds={remainingSeconds(l.deadlineAt)} urgentAt={3600} /></span>
            )}

            {l.status === 'quoted' && (
              <div className="flex flex-col gap-2 rounded-xl border border-border-strong bg-raised p-3">
                {l.quote.lineItems.map((li, i) => (
                  <div key={i} className="flex justify-between text-[13px] text-fg-muted">
                    <span>{li.label}</span>
                    <span className="font-mono">{formatMoney(li.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border pt-1.5 text-sm font-bold">
                  <span>Quoted total</span>
                  <span className="font-mono">{formatMoney(l.quote.total)}</span>
                </div>
                <span className="text-xs text-fg-muted">Quote expires in <Countdown key={`${l.id}-q`} seconds={remainingSeconds(l.quote.expiresAt)} urgentAt={3600} /></span>
                <Button onClick={() => acceptLead(l.id)} fullWidth>Accept quote — {formatMoney(l.quote.total)}</Button>
              </div>
            )}

            {l.status === 'accepted' && (
              <p className="text-xs text-success-text">Accepted — the owner has your agreed total of {formatMoney(l.quote.total)} on file.</p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
