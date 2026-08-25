import { useState } from 'react';
import { useSocial } from '../../context/social/useSocial';
import PostCard from '../../components/social/PostCard';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';

const TABS = [
  { id: 'followed', label: 'Followed', copy: 'Only accounts you follow, in the order they posted — nothing ranked.' },
  { id: 'explore', label: 'Explore', copy: 'Ranked by recency and relevance to trips you\'ve viewed. Sponsored posts are labelled and capped at 2 in every 10.' },
];

export default function Feed() {
  const { posts, following, blocked } = useSocial();
  const [tab, setTab] = useState('explore');

  const visible = posts
    .filter((p) => p.moderation !== 'removed' && p.moderation !== 'under_review')
    .filter((p) => !blocked.has(p.authorId))
    .filter((p) => tab === 'explore' || following.has(p.authorId));

  const hiddenBlockedCount = posts.filter((p) => blocked.has(p.authorId)).length;
  const activeTab = TABS.find((t) => t.id === tab);

  return (
    <div className="mx-auto flex max-w-[560px] flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Feed</h1>
        <Button to="/social/composer" size="sm">Post</Button>
      </div>

      <div className="flex gap-1.5">
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
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2.5 rounded-xl border border-info bg-info-soft p-3 text-[12.5px] leading-relaxed text-info-text">
        <span aria-hidden="true">i</span>
        <span>{activeTab.copy}</span>
      </div>

      {hiddenBlockedCount > 0 && (
        <div className="rounded-lg border border-border bg-sunken px-3 py-2 text-xs text-fg-muted">
          {hiddenBlockedCount} post{hiddenBlockedCount === 1 ? '' : 's'} hidden because you blocked this account.
        </div>
      )}

      {visible.length ? (
        <div className="flex flex-col gap-3">
          {visible.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      ) : (
        <EmptyState
          title={tab === 'followed' ? 'Nobody you follow has posted yet' : 'Nothing to explore right now'}
          body={tab === 'followed' ? 'Follow an operator or traveller from their profile to see their posts here.' : 'Check back soon, or switch to Followed.'}
          actionLabel="Switch tab"
          onAction={() => setTab(tab === 'followed' ? 'explore' : 'followed')}
        />
      )}
    </div>
  );
}
