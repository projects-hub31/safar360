import { useEffect, useState } from 'react';
import { useAdmin } from '../../context/admin/useAdmin';
import { useApp } from '../../context/app/useApp';
import PermGate from '../../components/admin/PermGate';
import { DataTable, StatusPill } from '../../components/ui';

const TONE = { accruing: 'neutral', accrued: 'info', pending: 'warning', released: 'success', 'held·dispute': 'held', reversed: 'danger' };
const KIND_LABEL = { commission: 'Commission', referral: 'Referral', payout: 'Payout' };
const KINDS = [{ id: 'all', label: 'All' }, { id: 'commission', label: 'Commission' }, { id: 'referral', label: 'Referral' }, { id: 'payout', label: 'Payout' }];

export default function Ledger() {
  const { ledger, fetchLedger } = useAdmin();
  const { formatMoney } = useApp();
  const [kind, setKind] = useState('all');

  useEffect(() => { fetchLedger(); }, [fetchLedger]);

  // Real rows (every vendor/booking that's actually happened, `ledgerId` as
  // the display reference) merged with the permanently-seeded referral rows
  // (no referral backend exists yet, §9 days 12-13 — AdminContext.jsx).
  const rows = ledger.filter((r) => kind === 'all' || r.kind === kind);

  const columns = [
    { key: 'ref', label: 'Reference', render: (r) => <span dir="ltr" className="font-mono text-xs">{r.ledgerId || r.id} · {r.ref}</span> },
    { key: 'party', label: 'Party', render: (r) => <span className="text-sm">{r.party}</span> },
    { key: 'kind', label: 'Kind', render: (r) => <span className="text-xs text-fg-muted">{KIND_LABEL[r.kind]}</span> },
    { key: 'gross', label: 'Gross', render: (r) => <span className="font-mono text-sm">{formatMoney(r.gross)}</span> },
    { key: 'rate', label: 'Rate', render: (r) => <span className="font-mono text-xs">{r.rate ? `${Math.round(r.rate * 100)}%` : '—'}</span> },
    { key: 'commission', label: 'Commission', render: (r) => <span className="font-mono text-xs">{r.commission ? formatMoney(r.commission) : '—'}</span> },
    { key: 'net', label: 'Net', render: (r) => <span className="font-mono text-sm font-semibold">{r.state === 'reversed' ? '− ' : ''}{formatMoney(r.net)}</span> },
    { key: 'state', label: 'State', render: (r) => <StatusPill tone={TONE[r.state]}>{r.state}</StatusPill> },
  ];

  return (
    <PermGate permKey="finance">
      <div className="mx-auto flex max-w-[1000px] flex-col gap-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Ledger</h1>
        <p className="text-xs leading-relaxed text-fg-subtle">
          Commission rows compute live from each vendor/seller's own plan or per-seller rate — this admin default is
          only the fallback shown in Config, never the charged rate. Referral rows are the same shared rows the
          referrals screen would read, filtered to <span className="font-mono">kind === 'referral'</span>.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setKind(k.id)}
              aria-pressed={kind === k.id}
              className={`min-h-9 rounded-lg border px-3 text-[13px] font-semibold ${
                kind === k.id ? 'border-primary bg-primary-soft text-primary-soft-text' : 'border-border-strong bg-surface text-fg'
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} emptyTitle="No ledger activity" />
      </div>
    </PermGate>
  );
}
