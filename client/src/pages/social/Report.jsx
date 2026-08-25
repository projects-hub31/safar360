import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocial } from '../../context/social/useSocial';
import { REPORT_REASONS } from '../../context/social/social-context';
import ChoiceCard from '../../components/ui/ChoiceCard';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';

export default function Report() {
  const { targetType, targetId } = useParams();
  const navigate = useNavigate();
  const { posts, reportPost } = useSocial();
  const [reasonId, setReasonId] = useState(null);
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [done, setDone] = useState(false);

  const post = targetType === 'post' ? posts.find((p) => p.id === targetId) : null;
  if (targetType === 'post' && !post) {
    return <EmptyState title="Nothing to report" body="This post may already have been removed." actionLabel="Back to feed" actionTo="/social/feed" />;
  }

  const onSubmit = () => {
    if (!reasonId) return;
    reportPost(post.id, reasonId, alsoBlock);
    setDone(true);
  };

  if (done) {
    return (
      <EmptyState
        title="Report submitted"
        body="Thanks — a moderator reviews this. We never tell the author who reported it, only that a rule was broken."
        actionLabel="Back to feed"
        actionTo="/social/feed"
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-[480px] flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Report this post</h1>
      <div className="flex flex-col gap-2">
        {REPORT_REASONS.map((r) => (
          <ChoiceCard key={r.id} active={reasonId === r.id} onClick={() => setReasonId(r.id)} title={r.label} subtitle={r.description} />
        ))}
      </div>

      <label className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm">
        <input type="checkbox" checked={alsoBlock} onChange={(e) => setAlsoBlock(e.target.checked)} className="h-[17px] w-[17px] accent-jade-600" />
        <span>Also block this account</span>
      </label>
      <p className="-mt-2 text-xs text-fg-muted">This is a separate action from filing the report — either can happen without the other.</p>

      <div className="flex gap-2">
        <Button variant="secondary" fullWidth onClick={() => navigate(-1)}>Cancel</Button>
        <Button fullWidth disabled={!reasonId} onClick={onSubmit}>Submit report</Button>
      </div>
    </div>
  );
}
