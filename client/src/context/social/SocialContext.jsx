import { useRef, useState } from 'react';
import { SocialContext } from './social-context';
import { AUTO_REVIEW_AT, FAIL_MESSAGE_TRIGGER } from './social-context';
import { SEED_POSTS, SEED_THREADS, AUTHORS } from '../../data/social/social';

// Module 07, traveller-facing slice (feed, composer, post detail, profile,
// chats, thread, report). Campaigns/referrals (influencer-only money screens)
// and the admin side of moderation are out of scope for this pass — see
// CLAUDE.md's module 07 build-order note.
export function SocialProvider({ children }) {
  const [posts, setPosts] = useState(SEED_POSTS);
  const [threads, setThreads] = useState(SEED_THREADS);
  const [blocked, setBlocked] = useState(() => new Set(SEED_THREADS.filter((t) => t.blocked).map((t) => t.withId)));
  const [following, setFollowing] = useState(() => new Set(['karakoram-expeditions', 'amna-sheikh']));

  const nextId = useRef(100);
  const genId = (prefix) => `${prefix}${nextId.current++}`;

  // --- posts -----------------------------------------------------------------
  // Like/save are optimistic local toggles — the design system's one other
  // named exception to "no optimistic UI on financial state" alongside
  // wishlist (§2 patterns), since neither is financial.
  const toggleLike = (postId) =>
    setPosts((ps) => ps.map((p) => (p.id !== postId ? p : {
      ...p, likedByMe: !p.likedByMe, likes: p.likes + (p.likedByMe ? -1 : 1),
    })));

  const toggleSave = (postId) =>
    setPosts((ps) => ps.map((p) => (p.id !== postId ? p : {
      ...p, savedByMe: !p.savedByMe, saves: p.saves + (p.savedByMe ? -1 : 1),
    })));

  // Announce-departure posts read live inventory at render time (via the
  // tourId they carry) and never bake seat count/price into the post itself
  // (§2 patterns) — enforced simply by never storing those fields here.
  const createPost = ({ type, text, tags, tourId, disclosed }) => {
    const id = genId('p');
    setPosts((ps) => [{
      id, authorId: 'me', type, text, img: null, alt: '',
      tags, tourId: tourId || null, sponsored: false, disclosed: !!disclosed,
      moderation: 'live', reportCount: 0, likedByMe: false, savedByMe: false, likes: 0, saves: 0,
      comments: [], createdAt: Date.now(),
    }, ...ps]);
    return id;
  };

  const addComment = (postId, text) => {
    const id = genId('c');
    setPosts((ps) => ps.map((p) => (p.id !== postId ? p : {
      ...p, comments: p.comments.concat({ id, authorId: 'me', text, state: 'live', createdAt: Date.now() }),
    })));
    return id;
  };

  // Files a report against a post (never a comment, in this pass) and moves
  // it through CONTENT_STATES: live → reported, then reported → under_review
  // automatically once AUTO_REVIEW_AT independent reports land. "Also block
  // this account" is a deliberately separate mutation (§6 report) — either
  // can happen without the other.
  const reportPost = (postId, reasonId, alsoBlock) => {
    setPosts((ps) => ps.map((p) => {
      if (p.id !== postId) return p;
      const reportCount = p.reportCount + 1;
      const moderation = reportCount >= AUTO_REVIEW_AT ? 'under_review' : (p.moderation === 'live' ? 'reported' : p.moderation);
      return { ...p, reportCount, moderation, lastReportReason: reasonId };
    }));
    if (alsoBlock) {
      const post = posts.find((p) => p.id === postId);
      if (post) blockAccount(post.authorId);
    }
  };

  // --- follow / block ---------------------------------------------------------
  const toggleFollow = (authorId) =>
    setFollowing((f) => {
      const next = new Set(f);
      if (next.has(authorId)) next.delete(authorId); else next.add(authorId);
      return next;
    });

  // A blocked thread stays visible, greyed, read-only — the transcript is
  // never deleted (§6 chats). Unblocking restores it in full, since nothing
  // was ever removed, only gated from new messages.
  const blockAccount = (authorId) => {
    setBlocked((b) => new Set(b).add(authorId));
    setThreads((ts) => ts.map((t) => (t.withId === authorId ? { ...t, blocked: true } : t)));
  };
  const unblockAccount = (authorId) => {
    setBlocked((b) => { const next = new Set(b); next.delete(authorId); return next; });
    setThreads((ts) => ts.map((t) => (t.withId === authorId ? { ...t, blocked: false } : t)));
  };

  // --- chats / messages --------------------------------------------------------
  // Sending → Sent → Delivered, exactly as the design system specifies (§6
  // thread) — no silent auto-resend on failure, only an explicit retry.
  // FAIL_MESSAGE_TRIGGER is a documented deterministic trigger (same spirit
  // as the auth module's magic OTP) so the Failed+retry branch is reachable
  // without a real flaky network.
  const sendMessage = (threadId, text) => {
    const id = genId('m');
    const willFail = text.toUpperCase().includes(FAIL_MESSAGE_TRIGGER);
    setThreads((ts) => ts.map((t) => (t.id !== threadId ? t : {
      ...t, messages: t.messages.concat({ id, from: 'me', text, state: 'sending', at: Date.now() }),
    })));
    setTimeout(() => {
      setThreads((ts) => ts.map((t) => (t.id !== threadId ? t : {
        ...t, messages: t.messages.map((m) => (m.id !== id ? m : { ...m, state: willFail ? 'failed' : 'sent' })),
      })));
      if (!willFail) {
        setTimeout(() => {
          setThreads((ts) => ts.map((t) => (t.id !== threadId ? t : {
            ...t, messages: t.messages.map((m) => (m.id !== id ? m : { ...m, state: 'delivered' })),
          })));
        }, 500);
      }
    }, 500);
    return id;
  };

  const retryMessage = (threadId, messageId) => {
    setThreads((ts) => ts.map((t) => (t.id !== threadId ? t : {
      ...t, messages: t.messages.map((m) => (m.id !== messageId ? m : { ...m, state: 'sending' })),
    })));
    setTimeout(() => {
      setThreads((ts) => ts.map((t) => (t.id !== threadId ? t : {
        ...t, messages: t.messages.map((m) => (m.id !== messageId ? m : { ...m, state: 'sent' })),
      })));
      setTimeout(() => {
        setThreads((ts) => ts.map((t) => (t.id !== threadId ? t : {
          ...t, messages: t.messages.map((m) => (m.id !== messageId ? m : { ...m, state: 'delivered' })),
        })));
      }, 500);
    }, 500);
  };

  const startThread = (authorId) => {
    const existing = threads.find((t) => t.withId === authorId);
    if (existing) return existing.id;
    const id = genId('t');
    setThreads((ts) => ts.concat({ id, withId: authorId, blocked: false, messages: [] }));
    return id;
  };

  // Falls back to a synthesized profile for any operator slug not in the seed
  // AUTHORS map (e.g. an operator linked from a tour card that has never
  // posted) rather than crashing a profile page that only has a name to go
  // on — still real, honest data (every tour's own operator field), just not
  // pre-seeded with a social history.
  const authorOf = (authorId) => {
    if (authorId === 'me') return { id: 'me', name: 'You', kind: 'traveller', tier: null, verified: false };
    if (AUTHORS[authorId]) return AUTHORS[authorId];
    const name = authorId.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return { id: authorId, name, kind: 'operator', tier: null, verified: true };
  };

  const value = {
    posts, threads, blocked, following,
    toggleLike, toggleSave, createPost, addComment, reportPost,
    toggleFollow, blockAccount, unblockAccount,
    sendMessage, retryMessage, startThread,
    authorOf,
  };

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}
