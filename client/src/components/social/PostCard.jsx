import { Link } from 'react-router-dom';
import { useSocial } from '../../context/useSocial';
import { TOURS } from '../../data/traveler/tours';
import StatusPill from '../ui/StatusPill';

// Deliberately ugly/achromatic/mono/uppercase/bordered — §2: "Two disclosure
// pills (Sponsored, Machine translated) are styled so they never read as
// decoration or a quality badge." Not built from StatusPill on purpose; a
// normal tone would make this look like an earned badge instead of a
// disclosure.
function DisclosurePill({ children }) {
  return (
    <span className="inline-flex w-fit items-center rounded border border-fg-subtle px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-fg-subtle">
      {children}
    </span>
  );
}

const MODERATION_PILL = {
  reported: { tone: 'warning', label: 'Reported — awaiting review' },
  under_review: { tone: 'held', label: 'Hidden pending review' },
  removed: { tone: 'danger', label: 'Removed' },
};

export default function PostCard({ post }) {
  const { toggleLike, toggleSave, authorOf } = useSocial();
  const author = authorOf(post.authorId);
  const tour = post.tourId ? TOURS.find((t) => t.id === post.tourId) : null;
  const modPill = MODERATION_PILL[post.moderation];

  return (
    <article className="flex flex-col gap-2.5 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2">
        <Link to={`/social/profile/${post.authorId}`} className="flex-1 text-[13.5px] font-bold text-fg no-underline">
          {author.name}
        </Link>
        {author.verified && <StatusPill tone="success" icon="✓">Verified</StatusPill>}
        {author.tier && <StatusPill tone="accent">{author.tier}</StatusPill>}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {post.sponsored && <DisclosurePill>Sponsored</DisclosurePill>}
        {modPill && <StatusPill tone={modPill.tone} className="w-fit">{modPill.label}</StatusPill>}
      </div>

      <p className="text-sm leading-relaxed text-fg">{post.text}</p>

      {post.type === 'announce-departure' && tour && (
        <Link to={`/discover/tour/${tour.id}`} className="flex items-center justify-between gap-2 rounded-lg border border-border-strong bg-raised px-3 py-2 text-xs no-underline">
          <span className="font-semibold text-fg">{tour.title}</span>
          <span className="font-mono text-fg-muted">live listing →</span>
        </Link>
      )}

      {post.img ? (
        <img src={post.img} alt={post.alt} loading="lazy" className="aspect-[4/3] w-full rounded-xl object-cover" />
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {post.tags.map((t) => <span key={t} className="text-xs font-semibold text-primary-soft-text">{t}</span>)}
      </div>

      <div className="flex items-center gap-4 border-t border-border pt-2 text-[13px] text-fg-muted">
        <button type="button" onClick={() => toggleLike(post.id)} aria-pressed={post.likedByMe} className={`font-semibold ${post.likedByMe ? 'text-danger-text' : ''}`}>
          {post.likedByMe ? '♥' : '♡'} {post.likes}
        </button>
        <button type="button" onClick={() => toggleSave(post.id)} aria-pressed={post.savedByMe} className={`font-semibold ${post.savedByMe ? 'text-primary' : ''}`}>
          {post.savedByMe ? '★' : '☆'} {post.saves}
        </button>
        <Link to={`/social/post/${post.id}`} className="font-semibold text-fg-muted no-underline">💬 {post.comments.length}</Link>
        <Link to={`/social/report/post/${post.id}`} className="ml-auto text-fg-subtle no-underline">Report</Link>
      </div>
    </article>
  );
}
