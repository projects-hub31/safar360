import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/app/useApp';
import { useTransport } from '../../context/transport/useTransport';
import { QUOTE_EXPIRY_OPTIONS } from '../../context/transport/transport-context';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import ChoiceCard from '../../components/ui/ChoiceCard';
import StatusPill from '../../components/ui/StatusPill';
import Countdown from '../../components/ui/Countdown';
import EmptyState from '../../components/ui/EmptyState';

const PRESET_LABELS = ['Vehicle fare', 'Permit fee', 'Fuel surcharge', 'Driver overnight'];
const PILL = { request: 'warning', quoted: 'info', declined: 'danger', accepted: 'success', expired: 'neutral', withdrawn: 'neutral' };

export default function Quote() {
  const location = useLocation();
  const navigate = useNavigate();
  const { formatMoney } = useApp();
  const { leads, sendQuote, declineLead, withdrawQuote, previewLeadOutcome } = useTransport();

  const lead = leads.find((l) => l.id === location.state?.leadId);

  const [lineItems, setLineItems] = useState([{ label: 'Vehicle fare', amount: '' }]);
  const [expiryHours, setExpiryHours] = useState(null);

  if (!lead) {
    return <EmptyState title="Quote not found" body="Open this from the Quotes inbox." actionLabel="Back to quotes" actionTo="/transport/quotes" />;
  }

  const total = lineItems.reduce((n, li) => n + (Number(li.amount) || 0), 0);
  const canSend = lineItems.some((li) => Number(li.amount) > 0) && expiryHours;

  const setItem = (i, patch) => setLineItems((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addItem = () => setLineItems((rows) => rows.concat({ label: '', amount: '' }));
  const removeItem = (i) => setLineItems((rows) => rows.filter((_, idx) => idx !== i));

  const onSend = () => {
    if (!canSend) return;
    sendQuote(lead.id, { lineItems: lineItems.filter((li) => Number(li.amount) > 0).map((li) => ({ label: li.label || 'Line item', amount: Number(li.amount) })), expiryHours });
    navigate('/transport/quotes');
  };

  const onDecline = () => {
    declineLead(lead.id);
    navigate('/transport/quotes');
  };

  return (
    <div className="mx-auto flex max-w-[560px] flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{lead.subjectLabel}</h1>
        <StatusPill tone={PILL[lead.status] || 'neutral'}>{lead.status}</StatusPill>
      </div>

      <Card className="flex flex-col gap-2 p-4 sm:p-5">
        <div className="flex justify-between text-sm"><span className="text-fg-muted">Traveller</span><span>{lead.name}</span></div>
        <div className="flex justify-between text-sm"><span className="text-fg-muted">Date</span><span>{lead.date}</span></div>
        <div className="flex justify-between text-sm"><span className="text-fg-muted">Passengers</span><span>{lead.count}</span></div>
        {lead.note && <div className="border-t border-border pt-2 text-sm text-fg-muted">"{lead.note}"</div>}
      </Card>

      <div className="rounded-xl border border-info bg-info-soft px-4 py-3 text-[13px] leading-relaxed text-info-text">
        No inventory hold and no payment happens until the traveller accepts a quote you send.
      </div>

      {lead.status === 'request' && (
        <Card className="flex flex-col gap-3 p-4 sm:p-5">
          <strong className="text-sm">Itemize the quote</strong>
          {lineItems.map((li, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2">
              <TextField label="Line item" list="presets" value={li.label} onChange={(e) => setItem(i, { label: e.target.value })} placeholder="Vehicle fare" className="flex-1" />
              <TextField label="Amount (Rs)" type="number" min={0} value={li.amount} onChange={(e) => setItem(i, { amount: e.target.value })} className="w-32" />
              {lineItems.length > 1 && (
                <Button size="sm" variant="secondary" onClick={() => removeItem(i)}>Remove</Button>
              )}
            </div>
          ))}
          <datalist id="presets">
            {PRESET_LABELS.map((p) => <option key={p} value={p} />)}
          </datalist>
          <Button size="sm" variant="secondary" onClick={addItem} className="self-start">+ Add line item</Button>

          <div className="flex justify-between border-t border-border pt-3 text-sm font-bold">
            <span>Total</span>
            <span className="font-mono">{formatMoney(total)}</span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[12.5px] font-bold text-fg">Quote expires in</span>
            <div className="grid grid-cols-3 gap-2">
              {QUOTE_EXPIRY_OPTIONS.map((o) => (
                <ChoiceCard key={o.hours} active={expiryHours === o.hours} onClick={() => setExpiryHours(o.hours)} title={o.label} />
              ))}
            </div>
          </div>

          <Button onClick={onSend} disabled={!canSend} fullWidth>Send quote</Button>
          <Button variant="destructive" onClick={onDecline}>Decline — no reason required</Button>
        </Card>
      )}

      {lead.status === 'quoted' && (
        <Card className="flex flex-col gap-3 p-4 sm:p-5">
          <strong className="text-sm">Quote sent</strong>
          {lead.quote.lineItems.map((li, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-fg-muted">{li.label}</span>
              <span className="font-mono">{formatMoney(li.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-border pt-2 text-sm font-bold">
            <span>Total</span>
            <span className="font-mono">{formatMoney(lead.quote.total)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-fg-muted">Expires in</span>
            <Countdown seconds={lead.quote.expiryHours * 3600} urgentAt={3600} />
          </div>
          <Button variant="destructive" onClick={() => withdrawQuote(lead.id)}>Withdraw quote</Button>
          <div className="border-t border-border pt-3">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-fg-subtle">
              Preview · no traveller review screen built yet
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => previewLeadOutcome(lead.id, 'accepted')}>If accepted</Button>
              <Button size="sm" variant="secondary" onClick={() => previewLeadOutcome(lead.id, 'expired')}>If expired</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
