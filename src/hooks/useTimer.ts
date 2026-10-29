import { useEffect, useRef, useState } from 'react';
import type { TimerState } from '../types/session';

const TICK_MS = 200;

/**
 * Displays a countdown derived from the timer's absolute end time, so it does not drift.
 * Runs a single interval only while the timer is running and calls onExpire once at zero.
 */
export function useCountdown(timer: TimerState, onExpire: () => void): number {
  const [now, setNow] = useState(() => Date.now());
  const expireRef = useRef(onExpire);
  expireRef.current = onExpire;

  useEffect(() => {
    if (timer.endsAt === null) return undefined;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(id);
  }, [timer.endsAt]);

  const remaining = timer.endsAt !== null ? Math.max(0, timer.endsAt - now) : Math.max(0, timer.remainingMs);

  const firedFor = useRef<number | null>(null);
  useEffect(() => {
    if (timer.endsAt !== null && remaining <= 0 && firedFor.current !== timer.endsAt) {
      firedFor.current = timer.endsAt;
      expireRef.current();
    }
  }, [remaining, timer.endsAt]);

  return remaining;
}
