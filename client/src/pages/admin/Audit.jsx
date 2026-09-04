import { useEffect, useState } from 'react';
import { useAdmin } from '../../context/admin/useAdmin';
import { AUDIT_FILTERS } from '../../context/admin/admin-context';
import PermGate from '../../components/admin/PermGate';
import { DataTable, StatusPill } from '../../components/ui';

const TONE = { danger: 'danger', warning: 'warning', held: 'held', success: 'success' };

function fmtAt(at) {
  return new Date(at).toLocaleString('en-PK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function Audit() {
  const { audit, fetchAudit } = useAdmin();
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchAudit(filter); }, [fetchAudit, filter]);

  const columns = [
    { key: 'at', label: 'When', render: (r) => <span dir="ltr" className="font-mono text-xs">{fmtAt(r.at)}</span> },
    { key: 'actor', label: 'Actor', render: (r) => <span className="text-sm">{r.actor}</span> },
    { key: 'action', label: 'Action', render: (r) => <span className="text-sm">{r.action}</span> },
    { key: 'target', label: 'Target', render: (r) => <span className="text-xs text-fg-muted">{r.target}</span> },
    { key: 'tone', label: '', render: (r) => <StatusPill tone={TONE[r.tone] || 'neutral'}>{r.refused ? 'refused' : r.tone}</StatusPill> },
  ];

  return (
    <PermGate permKey="audit">
      <div className="mx-auto flex max-w-[900px] flex-col gap-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Audit log</h1>
        <p className="text-xs leading-relaxed text-fg-subtle">
          One shared, append-only log every mutation writes to — including refusals (a payout approval blocked for
          matching the preparer's identity shows up here too, not just successes).
        </p>
        <div className="flex flex-wrap gap-1.5">
          {AUDIT_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`min-h-9 rounded-lg border px-3 text-[13px] font-semibold ${
                filter === f.id ? 'border-primary bg-primary-soft text-primary-soft-text' : 'border-border-strong bg-surface text-fg'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <DataTable columns={columns} rows={audit} rowKey={(r) => r.id} emptyTitle="Nothing matches this filter" />
      </div>
    </PermGate>
  );
}
