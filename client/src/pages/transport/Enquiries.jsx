import { useState } from 'react';
import { useApp } from '../../context/app/useApp';
import { useTransport } from '../../context/transport/useTransport';
import { QUOTE_EXPIRY_OPTIONS, LEAD_WINDOW_HOURS } from '../../context/transport/transport-context';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import ChoiceCard from '../../components/ui/ChoiceCard';
import StatusPill from '../../components/ui/StatusPill';
import Countdown from '../../components/ui/Countdown';
import EmptyState from '../../components/ui/EmptyState';

const TABS = [
  { id: 'request', label: 'Awaiting' },
  { id: 'quoted', label: 'Quoted' },
  { id: 'declined', label: 'Declined' },
];
const PILL = { request: 'warning', quoted: 'info', declined: 'danger', accepted: 'success', expired: 'neutral', withdrawn: 'neutral' };
const KIND_LABEL = { table: 'Table', group: 'Group' };

function ReplyForm({ onSend, onDecline }) {
  const { formatMoney } = useApp();
  const [price, setPrice] = useState('');
  const [expiryHours, setExpiryHours] = useState(null);
  const canSend = Number(price) > 0 && expiryHours;

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-3">
      <TextField label="Quote amount (Rs)" type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} className="w-40" />
      <div className="flex flex-col gap-2">
        <span className="text-[12.5px] font-bold text-fg">Expires in</span>
        <div className="grid grid-cols-3 gap-2">
          {QUOTE_EXPIRY_OPTIONS.map((o) => (
            <ChoiceCard key={o.hours} active={expiryHours === o.hours} onClick={() => setExpiryHours(o.hours)} title={o.label} />
          ))}
        </div>
      </div>
      {Number(price) > 0 && <div className="text-sm font-semibold">Total <span className="font-mono">{formatMoney(Number(price))}</span></div>}
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSend({ lineItems: [{ label: 'Quote', amount: Number(price) }], expiryHours })} disabled={!canSend}>
          Send quote
        </Button>
        <Button size="sm" variant="destructive" onClick={onDecline}>Decline — no reason required</Button>
      </div>
    </div>
  );
}

export default function Enquiries() {
  const { formatMoney } = useApp();
  const { leads, sendQuote, declineLead, withdrawQuote, previewLeadOutcome } = useTransport();
  const [tab, setTab] = useState('request');
  const [openId, setOpenId] = useState(null);

  const propertyLeads = leads.filter((l) => l.kind === 'table' || l.kind === 'group');
  const rows = propertyLeads.filter((l) => l.status === tab).slice().reverse();
  const counts = { request: 0, quoted: 0, declined: 0 };
  propertyLeads.forEach((l) => { if (counts[l.status] !== undefined) counts[l.status] += 1; });

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Enquiries</h1>
      <p className="text-xs leading-relaxed text-fg-subtle">
        No table is held, no room is blocked, and no payment is taken until you send a quote and it's accepted.
      </p>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={`min-h-9 rounded-lg border px-3 text-[13px] font-semibold ${
              tab === t.id ? 'border-primary bg-primary-soft text-primary-soft-text' : 'border-border-strong bg-surface text-fg'
            }`}
          >
            {t.label}{counts[t.id] ? ` (${counts[t.id]})` : ''}
          </button>
        ))}
      </div>

      {rows.length ? (
        <div className="flex flex-col gap-2.5">
          {rows.map((l) => (
            <Card key={l.id} className="flex flex-col gap-3 p-4">
              <button type="button" onClick={() => setOpenId((id) => (id === l.id ? null : l.id))} className="flex flex-wrap items-center gap-3 text-left">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-sm font-bold">{KIND_LABEL[l.kind]} · {l.name}</span>
                  <span className="text-xs text-fg-muted">{l.date} · {l.count} guests{l.note ? ` · "${l.note}"` : ''}</span>
                </div>
                {l.status === 'quoted' && <span className="font-mono text-sm font-semibold">{formatMoney(l.quote.total)}</span>}
                <StatusPill tone={PILL[l.status] || 'neutral'}>{l.status}</StatusPill>
                {l.status === 'request' && (
                  <span className="flex items-center gap-1.5 rounded-md border border-warning bg-warning-soft px-2 py-1 text-[11px] font-semibold text-warning-text">
                    Reply within <Countdown seconds={LEAD_WINDOW_HOURS * 3600} urgentAt={21600} />
                  </span>
                )}
              </button>

              {openId === l.id && l.status === 'request' && (
                <ReplyForm
                  lead={l}
                  onSend={({ lineItems, expiryHours }) => { sendQuote(l.id, { lineItems, expiryHours }); setOpenId(null); }}
                  onDecline={() => { declineLead(l.id); setOpenId(null); }}
                />
              )}

              {openId === l.id && l.status === 'quoted' && (
                <div className="flex flex-col gap-2 border-t border-border pt-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-fg-muted">Expires in</span>
                    <Countdown seconds={l.quote.expiryHours * 3600} urgentAt={3600} />
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => withdrawQuote(l.id)}>Withdraw quote</Button>
                  <div className="border-t border-border pt-2">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                      Preview · no traveller review screen built yet
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => previewLeadOutcome(l.id, 'accepted')}>If accepted</Button>
                      <Button size="sm" variant="secondary" onClick={() => previewLeadOutcome(l.id, 'expired')}>If expired</Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="Nothing here" body="Restaurant table and group requests land as Awaiting with a 24-hour reply clock." />
      )}
    </div>
  );
}
