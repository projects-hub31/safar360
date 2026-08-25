import { createContext } from 'react';

export const SocialContext = createContext(null);

export {
  REPORT_REASONS, CONTENT_STATES, AUTO_REVIEW_AT, POST_MAX_CHARS, HASHTAG_RE,
  POST_TYPES, AUTHORS, FAIL_MESSAGE_TRIGGER,
  DEMO_INFLUENCER_ID, COLLAB_TRANSITIONS,
} from '../../data/social/social';

// Platform fee withheld when money actually reaches an influencer's account
// — applies uniformly to a released referral commission and a paid
// collaboration's escrow (§6 07 social "referrals": "'Earned, not yet paid'
// breaks out gross / 10% tax withheld / net"; §3 campaigns: "paid ... net of
// a 10% platform fee withheld" — one rule, stated twice in the source spec).
export const INFLUENCER_PLATFORM_FEE_PCT = 10;
