import Button from './Button';

// C-15 Empty state (see CLAUDE.md design system §2). Copy formula: what
// happened (no blame) → why (one clause) → the single next action.
export default function EmptyState({ title, body, actionLabel, actionTo, onAction }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface p-6 sm:p-10">
      <div className="font-display text-xl font-semibold tracking-tight sm:text-2xl">{title}</div>
      {body && <div className="max-w-[52ch] text-sm leading-relaxed text-fg-muted">{body}</div>}
      {actionLabel && (
        <Button to={actionTo} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
