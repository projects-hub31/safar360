import { useEffect, useRef, useState } from 'react';

// h:mm:ss once the duration crosses an hour (the 24h request/group windows),
// m:ss below that (checkout lock, OTP TTL) — "1439:51" reads as a bug, not a
// clock, so the format has to adapt to what's actually being counted down.
function format(totalSeconds) {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

/**
 * C-05 Slot-lock timer (see CLAUDE.md design system §2) — one ticking clock
 * shared by OTP TTL, checkout hold, request-to-book window, subscription
 * grace. Steps once a second, tabular, never animates its digits (Law 3).
 *
 * `seconds` is a plain duration set once by the caller at the moment a lock/
 * OTP/lockout is created — this component only ticks it down locally and
 * never reads the wall clock itself (render must stay pure; Date.now() has
 * no legitimate place in a render path). That's a deliberate simplification
 * until there's a backend to reconcile against: a backgrounded tab can drift
 * from a real server deadline. To restart a countdown (e.g. on OTP resend),
 * change the element's `key` rather than passing a new `seconds` value — the
 * remount is what resets it.
 */
export default function Countdown({ seconds, urgentAt = 120, onExpire, className = '' }) {
  const [left, setLeft] = useState(seconds);
  const firedRef = useRef(false);

  useEffect(() => {
    if (left <= 0) return undefined;
    const t = setTimeout(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [left]);

  useEffect(() => {
    if (left > 0 || firedRef.current) return;
    firedRef.current = true;
    onExpire?.();
  }, [left, onExpire]);

  const urgent = left <= urgentAt;

  return (
    <span
      role={urgent ? 'alert' : undefined}
      dir="ltr"
      className={`font-mono tabular-nums ${urgent ? 'font-bold text-danger-text' : 'font-semibold text-fg'} ${className}`}
    >
      {format(left)}
    </span>
  );
}
