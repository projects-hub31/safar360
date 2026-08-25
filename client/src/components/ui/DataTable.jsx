import Card from './Card';
import EmptyState from './EmptyState';

// C-13 Data table with bulk actions (CLAUDE.md design system §2) — powers the
// KYC queue, moderation queue, payout batch, and audit log. Below ~1024px it
// renders as a stacked card list instead of a table, per spec. `columns` is
// `[{ key, label, render(row) }]`; `renderActions(row)`, if given, renders
// per-row buttons — reason-per-row prompts, if a screen needs one, are that
// screen's own concern (kept out of this shell so it stays generic).
export default function DataTable({
  columns,
  rows,
  rowKey,
  renderActions,
  selectable = false,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  emptyTitle = 'Nothing here',
  emptyBody,
}) {
  if (!rows.length) return <EmptyState title={emptyTitle} body={emptyBody} />;

  const allSelected = selectable && rows.length > 0 && rows.every((r) => selectedIds?.has(rowKey(r)));

  return (
    <>
      {/* Stacked cards — narrow viewports / dense admin tables collapse here */}
      <div className="flex flex-col gap-2.5 lg:hidden">
        {rows.map((row) => (
          <Card key={rowKey(row)} className="flex flex-col gap-2 p-4">
            {selectable && (
              <label className="flex items-center gap-2 text-xs font-semibold text-fg-muted">
                <input
                  type="checkbox"
                  checked={selectedIds.has(rowKey(row))}
                  onChange={() => onToggleSelect(rowKey(row))}
                  className="h-4 w-4"
                />
                Select
              </label>
            )}
            {columns.map((col) => (
              <div key={col.key} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-fg-muted">{col.label}</span>
                <span className="min-w-0 text-right">{col.render(row)}</span>
              </div>
            ))}
            {renderActions && (
              <div className="flex flex-wrap gap-2 border-t border-border pt-2.5">{renderActions(row)}</div>
            )}
          </Card>
        ))}
      </div>

      {/* Real table — desktop admin surfaces (§2 breakpoints: admin gains a
          denser layout from ≥1240; we key off Tailwind's lg (1024) since no
          custom breakpoint scale is configured yet — see CLAUDE.md). */}
      <div className="hidden overflow-x-auto rounded-2xl border border-border lg:block">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-sunken text-left text-xs font-semibold uppercase tracking-wider text-fg-subtle">
              {selectable && (
                <th className="w-10 px-3 py-2.5">
                  <input type="checkbox" checked={allSelected} onChange={(e) => onToggleSelectAll(e.target.checked)} className="h-4 w-4" />
                </th>
              )}
              {columns.map((col) => (
                <th key={col.key} className="px-3 py-2.5">{col.label}</th>
              ))}
              {renderActions && <th className="px-3 py-2.5" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-border text-fg last:border-0">
                {selectable && (
                  <td className="px-3 py-2.5">
                    <input type="checkbox" checked={selectedIds.has(rowKey(row))} onChange={() => onToggleSelect(rowKey(row))} className="h-4 w-4" />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-2.5 align-middle">{col.render(row)}</td>
                ))}
                {renderActions && (
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-2">{renderActions(row)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
