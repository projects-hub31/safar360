import { useRef, useState } from 'react';
import { SocialContext } from './social-context';
import { AUTO_REVIEW_AT, FAIL_MESSAGE_TRIGGER, CONTENT_STATES, COLLAB_TRANSITIONS } from './social-context';
import { SEED_POSTS, SEED_THREADS, AUTHORS, SEED_COLLABS } from '../../data/social/social';

// Module 07, traveller-facing slice (feed, composer, post detail, profile,
// chats, thread, report), the two actions (moderateContent, appealPost)
// module 09's admin moderation queue calls — this stays the one place
// CONTENT_STATES actually gets mutated, same reuse pattern as AuthContext's
// shared setKycStatus — plus the influencer-only collaboration lifecycle
// (§3 "Collaboration lifecycle") backing the Campaigns/Collab/Referrals
// screens.
export function SocialProvider({ children }) {
  const [posts, setPosts] = useState(SEED_POSTS);
  const [collabs, setCollabs] = useState(SEED_COLLABS);
  // Per-report records (postId, reasonId, reporterId, at) — reportPost() used
  // to only bump an aggregate reportCount, which is enough for the traveller-
  // facing pass but not enough for a moderation queue to tally reasons
  // ("Spam ×2", §6 admin/moderation) or to honour "reporters are never
  // disclosed to the author" as a real per-report fact rather than a promise.
  const [reports, setReports] = useState([]);
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
    setReports((rs) => rs.concat({ id: genId('rp'), postId, reasonId, reporterId: 'me', at: Date.now() }));
    if (alsoBlock) {
      const post = posts.find((p) => p.id === postId);
      if (post) blockAccount(post.authorId);
    }
  };

  // Admin moderation decision (module 09) — the ONE mutation path for a
  // content state change, shared by the not-yet-built full admin queue and
  // anything else that ever needs to move a post through CONTENT_STATES, same
  // spirit as AuthContext's shared setKycStatus. `action` must be a legal next
  // state for the post's CURRENT state per CONTENT_STATES (§3) — the admin
  // screen is expected to only ever offer buttons already filtered through
  // that same table, but this still refuses an illegal move defensively
  // rather than trusting the caller. `removed`/`restored` require a reason
  // (§3); dismissing back to `live` from `reported` does not.
  const moderateContent = (postId, action, reason, moderatorName) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return { ok: false, error: 'Post not found.' };
    const legal = CONTENT_STATES[post.moderation] || [];
    if (!legal.includes(action)) return { ok: false, error: `"${action}" isn't a legal move from "${post.moderation}".` };
    if ((action === 'removed' || action === 'restored') && !reason) {
      return { ok: false, error: 'A reason is required for this decision.' };
    }
    setPosts((ps) => ps.map((p) => (p.id !== postId ? p : {
      ...p, moderation: action, lastDecisionReason: reason || null, lastModeratorName: moderatorName || null,
      appealed: action === 'removed' ? false : p.appealed,
    })));
    return { ok: true };
  };

  // One appeal only, and it must go to a DIFFERENT moderator than whoever
  // made the original decision (§3) — enforced by name here since this app
  // has no real multi-admin identity system yet (single demo account, same
  // limitation the payout-batch two-step approval works around).
  const appealPost = (postId, reviewerName) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return { ok: false, error: 'Post not found.' };
    if (post.moderation !== 'removed') return { ok: false, error: 'Only a removed post can be appealed.' };
    if (post.appealed) return { ok: false, error: 'This decision has already been appealed once.' };
    if (post.lastModeratorName && reviewerName && post.lastModeratorName === reviewerName) {
      return { ok: false, error: `${reviewerName} made the original decision — an appeal needs a different reviewer.` };
    }
    setPosts((ps) => ps.map((p) => (p.id !== postId ? p : { ...p, moderation: 'restored', appealed: true, lastDecisionReason: 'Appeal upheld', lastModeratorName: reviewerName || null })));
    return { ok: true };
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

  // --- collaborations (§3 collaboration lifecycle, influencer-only) ---------
  // One shared transition-checking action per legal move, same shape as
  // moderateContent above: refuses a move that isn't legal from the
  // collaboration's current status per COLLAB_TRANSITIONS rather than
  // trusting the caller.
  const transitionCollab = (id, action, extra = {}) => {
    const collab = collabs.find((c) => c.id === id);
    if (!collab) return { ok: false, error: 'Collaboration not found.' };
    const legal = COLLAB_TRANSITIONS[collab.status] || [];
    if (!legal.includes(action)) return { ok: false, error: `"${action}" isn't a legal move from "${collab.status}".` };
    setCollabs((cs) => cs.map((c) => (c.id !== id ? c : { ...c, status: action, ...extra })));
    return { ok: true };
  };

  const acceptCollab = (id) => transitionCollab(id, 'accepted', { acceptedAt: Date.now() });
  const declineCollab = (id) => transitionCollab(id, 'declined', { declinedAt: Date.now() });
  const startCollab = (id) => transitionCollab(id, 'in_progress', { startedAt: Date.now() });
  // 7-day notice is stated as on-screen copy rather than a real scheduled
  // effective date — same honest simplification as the room-reservation
  // one-call note in CLAUDE.md §5 (no real scheduling engine exists here);
  // the cancellation applies immediately in this demo.
  const cancelCollab = (id) => transitionCollab(id, 'cancelled', { cancelledAt: Date.now(), cancelledBy: 'you' });

  const toggleDeliverable = (collabId, deliverableId, field) => {
    setCollabs((cs) => cs.map((c) => (c.id !== collabId ? c : {
      ...c,
      deliverables: c.deliverables.map((d) => (d.id !== deliverableId ? d : { ...d, [field]: !d[field] })),
    })));
  };

  // Only legal once every deliverable is both verified and disclosed (§3:
  // "released on verified + disclosed deliverables") — refused otherwise,
  // same defensive-refusal shape as moderateContent/transitionCollab.
  const markDelivered = (id) => {
    const collab = collabs.find((c) => c.id === id);
    if (!collab) return { ok: false, error: 'Collaboration not found.' };
    if (!collab.deliverables.every((d) => d.verified && d.disclosed)) {
      return { ok: false, error: 'Every deliverable must be verified and disclosed first.' };
    }
    return transitionCollab(id, 'delivered', { deliveredAt: Date.now() });
  };

  // Demo-only advance (no real payment gateway) — same honestly-labeled
  // lever pattern as ShopContext.advanceFulfilment / BookingContext.forceOutcome.
  const markPaid = (id) => transitionCollab(id, 'paid', { paidAt: Date.now() });

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
    posts, reports, threads, blocked, following,
    toggleLike, toggleSave, createPost, addComment, reportPost,
    moderateContent, appealPost,
    toggleFollow, blockAccount, unblockAccount,
    sendMessage, retryMessage, startThread,
    authorOf,
    collabs, acceptCollab, declineCollab, startCollab, cancelCollab, toggleDeliverable, markDelivered, markPaid,
  };

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}
