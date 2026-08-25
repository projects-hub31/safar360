import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSocial } from '../../context/social/useSocial';
import TextField from '../../components/ui/TextField';
import EmptyState from '../../components/ui/EmptyState';

function chipClasses(on) {
  return [
    'min-h-9 rounded-lg border px-3 text-[12.5px] font-semibold',
    on ? 'border-primary bg-primary-soft text-primary-soft-text' : 'border-border-strong bg-surface text-fg',
  ].join(' ');
}

// The wireframe's real, separate `isExplore` screen (search + live hashtag
// chips + a 1:1 image grid) — distinct from `Feed.jsx`'s own Followed/
// Explore *tabs*, which are a real, smaller feature inside `isFeed` and stay
// as they are. A tag tapped on any post (`PostCard.jsx`) lands here
// pre-filtered via router `state`, matching `Search.jsx`'s own
// `location.state?.where` convention rather than a query-string mechanism.
export default function Explore() {
  const location = useLocation();
  const { posts, following, blocked, authorOf } = useSocial();
  const [query, setQuery] = useState('');
  const [activeTags, setActiveTags] = useState(() => (location.state?.tag ? new Set([location.state.tag]) : new Set()));

  const visible = useMemo(
    () => posts
      .filter((p) => p.moderation !== 'removed' && p.moderation !== 'under_review')
      .filter((p) => !blocked.has(p.authorId)),
    [posts, blocked],
  );

  const hashtags = useMemo(() => {
    const counts = new Map();
    visible.forEach((p) => p.tags.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [visible]);

  const toggleTag = (tag) => {
    setActiveTags((tags) => {
      const next = new Set(tags);
      if (next.has(tag)) next.delete(tag); else next.add(tag);
      return next;
    });
  };

  const q = query.trim().toLowerCase();
  const filtered = visible.filter((p) => {
    const matchesTags = activeTags.size === 0 || p.tags.some((t) => activeTags.has(t));
    if (!matchesTags) return false;
    if (!q) return true;
    const author = authorOf(p.authorId);
    return `${p.text} ${p.tags.join(' ')} ${author.name}`.toLowerCase().includes(q);
  });

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Explore</h1>
        <p className="text-sm text-fg-muted">Ranked by recency and relevance to trips you&rsquo;ve viewed. Sponsored posts are labelled and capped at 2 in every 10.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <TextField
          className="min-w-[220px] flex-1"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search places, people, tags"
          aria-label="Search"
        />
        <span dir="ltr" className="font-mono text-xs text-fg-subtle">{filtered.length} posts</span>
      </div>

      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {hashtags.map(([tag, count]) => (
            <button key={tag} type="button" aria-pressed={activeTags.has(tag)} onClick={() => toggleTag(tag)} className={chipClasses(activeTags.has(tag))}>
              {tag} <span dir="ltr" className="font-mono text-[11px] opacity-70">{count}</span>
            </button>
          ))}
        </div>
      )}

      {filtered.length ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {filtered.map((p) => (
            <Link key={p.id} to={`/social/post/${p.id}`} className="relative block aspect-square overflow-hidden rounded-xl bg-sunken no-underline">
              {p.img ? (
                <img src={p.img} alt={p.alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center p-3 text-center font-display text-sm font-semibold text-fg-subtle">
                  {p.text.slice(0, 60)}
                </span>
              )}
              <span className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 bg-gradient-to-t from-black/85 to-transparent p-2.5">
                <span dir="ltr" className="font-mono text-[11px] font-semibold text-white">♥ {p.likes}</span>
                <span dir="ltr" className="font-mono text-[11px] text-[#D3D3D8]">◎ {p.comments.length}</span>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nothing matches yet"
          body={activeTags.size || q ? 'Try a different tag or search term.' : 'Check back soon as more people post.'}
          actionLabel={activeTags.size || q ? 'Clear filters' : undefined}
          onAction={activeTags.size || q ? () => { setQuery(''); setActiveTags(new Set()); } : undefined}
        />
      )}

      <span className="text-xs text-fg-subtle">
        {following.size} account{following.size === 1 ? '' : 's'} followed — switch to the Feed tab for just them.
      </span>
    </div>
  );
}
