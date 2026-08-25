import { createContext } from 'react';

export const SocialContext = createContext(null);

export {
  REPORT_REASONS, CONTENT_STATES, AUTO_REVIEW_AT, POST_MAX_CHARS, HASHTAG_RE,
  POST_TYPES, AUTHORS, FAIL_MESSAGE_TRIGGER,
} from '../../data/social/social';
