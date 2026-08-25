import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSocial } from '../../context/social/useSocial';
import PostCard from '../../components/social/PostCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import EmptyState from '../../components/ui/EmptyState';

export default function Post() {
  const { id } = useParams();
  const { posts, addComment, authorOf } = useSocial();
  const [text, setText] = useState('');

  const post = posts.find((p) => p.id === id);
  if (!post) {
    return <EmptyState title="Post not found" body="It may have been removed." actionLabel="Back to feed" actionTo="/social/feed" />;
  }

  const onComment = () => {
    if (!text.trim()) return;
    addComment(post.id, text.trim());
    setText('');
  };

  return (
    <div className="mx-auto flex max-w-[560px] flex-col gap-4">
      <PostCard post={post} />

      <Card className="flex flex-col gap-3 p-4 sm:p-5">
        <strong className="text-sm">Comments</strong>
        {post.comments.length ? (
          post.comments.map((c) => {
            const author = authorOf(c.authorId);
            const underReview = c.state === 'under_review';
            return (
              <div key={c.id} className="flex flex-col gap-0.5 border-t border-border pt-2.5 first:border-0 first:pt-0">
                <span className="text-xs font-bold">{author.name}</span>
                <span className={underReview ? 'text-sm italic text-fg-subtle' : 'text-sm text-fg'}>{c.text}</span>
                {underReview && (
                  <span className="w-fit rounded border border-held bg-held-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-held-text">
                    Hidden pending review
                  </span>
                )}
              </div>
            );
          })
        ) : (
          <span className="text-sm text-fg-muted">No comments yet.</span>
        )}

        <div className="flex gap-2 border-t border-border pt-3">
          <TextField className="flex-1" value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment…" dir="auto" />
          <Button onClick={onComment} disabled={!text.trim()}>Send</Button>
        </div>
      </Card>
    </div>
  );
}
