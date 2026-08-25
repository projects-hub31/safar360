import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useSocial } from '../../context/useSocial';
import PostCard from '../../components/social/PostCard';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';
import EmptyState from '../../components/ui/EmptyState';

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { posts, following, toggleFollow, authorOf, startThread } = useSocial();

  const authorId = id || 'me';
  const isSelf = authorId === 'me';
  const author = isSelf ? { id: 'me', name: user?.name || 'You', kind: 'traveller', tier: null, verified: false } : authorOf(authorId);
  const myPosts = posts.filter((p) => p.authorId === authorId && p.moderation !== 'removed');
  const isFollowing = following.has(authorId);

  return (
    <div className="mx-auto flex max-w-[560px] flex-col gap-4">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
        <span className="grid h-14 w-14 flex-none place-items-center rounded-full bg-primary-soft font-display text-lg font-bold text-primary-soft-text">
          {author.name.charAt(0)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-display text-lg font-semibold">{author.name}</span>
            {author.verified && <StatusPill tone="success" icon="✓">Verified</StatusPill>}
            {author.tier && <StatusPill tone="accent">{author.tier}</StatusPill>}
          </div>
          <span className="text-xs text-fg-muted capitalize">{author.kind}</span>
          {author.tier && <span className="text-[11px] text-fg-subtle">Tier earned from completed collaborations and disclosed posts — never bought.</span>}
        </div>
        {!isSelf && (
          <div className="flex flex-none flex-col gap-1.5">
            <Button size="sm" variant={isFollowing ? 'secondary' : 'primary'} onClick={() => toggleFollow(authorId)}>
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
            <Button size="sm" variant="tertiary" onClick={() => navigate(`/social/thread/${startThread(authorId)}`)}>Message</Button>
          </div>
        )}
      </div>

      {myPosts.length ? (
        <div className="flex flex-col gap-3">
          {myPosts.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      ) : (
        <EmptyState title="No posts yet" body={isSelf ? 'Share a trip report or photo and it will show up here.' : 'This account hasn\'t posted anything yet.'} actionLabel={isSelf ? 'New post' : undefined} actionTo={isSelf ? '/social/composer' : undefined} />
      )}
    </div>
  );
}
