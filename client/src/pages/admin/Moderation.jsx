import { useState } from 'react';
import { useSocial } from '../../context/social/useSocial';
import { CONTENT_STATES, REPORT_REASONS } from '../../context/social/social-context';
import PermGate from '../../components/admin/PermGate';
import { Card, Button, StatusPill, TextField } from '../../components/ui';

const ACTION_LABEL = { under_review: 'Escalate to review', live: 'Dismiss — keep live', removed: 'Remove', restored: 'Restore' };
const TONE = { live: 'success', reported: 'warning', under_review: 'held', removed: 'danger', restored: 'neutral' };
const NEEDS_ACTION = ['reported', 'under_review'];

function ReasonTally({ postId, reports }) {
  const counts = {};
  reports.filter((r) => r.postId === postId).forEach((r) => { counts[r.reasonId] = (counts[r.reasonId] || 0) + 1; });
  const entries = Object.entries(counts);
  if (!entries.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([reasonId, count]) => (
        <span key={reasonId} className="rounded-md border border-border-strong bg-sunken px-2 py-0.5 text-[11px] font-semibold text-fg-muted">
          {REPORT_REASONS.find((r) => r.id === reasonId)?.label || reasonId} ×{count}
        </span>
      ))}
    </div>
  );
}

export default function Moderation() {
  const { posts, reports, moderateContent, appealPost, authorOf } = useSocial();
  const [reasonDraft, setReasonDraft] = useState({});
  const [appealDraft, setAppealDraft] = useState({});
  const [error, setError] = useState({});

  const queue = posts.filter((p) => NEEDS_ACTION.includes(p.moderation));
  const decided = posts.filter((p) => p.moderation === 'removed' || p.moderation === 'restored');

  const onDecide = (post, action) => {
    const reason = reasonDraft[post.id] || '';
    const res = moderateContent(post.id, action, reason, 'You');
    if (!res.ok) { setError((e) => ({ ...e, [post.id]: res.error })); return; }
    setError((e) => ({ ...e, [post.id]: null }));
  };

  const onAppeal = (post) => {
    const reviewer = appealDraft[post.id] || '';
    const res = appealPost(post.id, reviewer);
    setError((e) => ({ ...e, [post.id]: res.ok ? null : res.error }));
  };

  return (
    <PermGate permKey="moderation">
      <div className="mx-auto flex max-w-[820px] flex-col gap-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Moderation queue</h1>
        <p className="text-xs leading-relaxed text-fg-subtle">
          Decision buttons are generated from the content's own current state — an illegal move is never offered, not
          even disabled. Reporters are never shown to the author; the author only ever sees the rule that was broken.
        </p>

        {queue.length === 0 && (
          <Card className="p-6 text-sm text-fg-muted">Nothing needs a decision right now.</Card>
        )}

        {queue.map((post) => {
          const legalActions = CONTENT_STATES[post.moderation] || [];
          const needsReason = legalActions.some((a) => a === 'removed' || a === 'restored');
          return (
            <Card key={post.id} className="flex flex-col gap-2.5 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">{authorOf(post.authorId).name} · {post.type}</span>
                <StatusPill tone={TONE[post.moderation]}>{post.moderation.replace('_', ' ')}</StatusPill>
              </div>
              <p className="text-sm text-fg-muted">{post.text}</p>
              <ReasonTally postId={post.id} reports={reports} />
              {needsReason && (
                <TextField
                  label="Reason (shown to the author, never who reported)"
                  value={reasonDraft[post.id] || ''}
                  onChange={(e) => setReasonDraft((d) => ({ ...d, [post.id]: e.target.value }))}
                />
              )}
              {error[post.id] && <span className="text-xs text-danger-text">{error[post.id]}</span>}
              <div className="flex flex-wrap gap-2">
                {legalActions.map((action) => (
                  <Button key={action} size="sm" variant={action === 'removed' ? 'destructive' : 'primary'} onClick={() => onDecide(post, action)}>
                    {ACTION_LABEL[action]}
                  </Button>
                ))}
              </div>
            </Card>
          );
        })}

        {decided.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <strong className="text-sm text-fg-muted">Decided</strong>
            {decided.map((post) => (
              <Card key={post.id} className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">{authorOf(post.authorId).name} · {post.type}</span>
                  <StatusPill tone={TONE[post.moderation]}>{post.moderation}</StatusPill>
                </div>
                <p className="text-xs text-fg-muted">
                  {post.lastDecisionReason} — decided by {post.lastModeratorName || 'a moderator'}
                </p>
                {post.moderation === 'removed' && !post.appealed && (
                  <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
                    <TextField
                      placeholder="Reviewer name (must differ from original decider)"
                      value={appealDraft[post.id] || ''}
                      onChange={(e) => setAppealDraft((d) => ({ ...d, [post.id]: e.target.value }))}
                      className="min-w-[220px] flex-1"
                    />
                    <Button size="sm" variant="secondary" onClick={() => onAppeal(post)}>File one appeal</Button>
                  </div>
                )}
                {error[post.id] && <span className="text-xs text-danger-text">{error[post.id]}</span>}
              </Card>
            ))}
          </div>
        )}
      </div>
    </PermGate>
  );
}
