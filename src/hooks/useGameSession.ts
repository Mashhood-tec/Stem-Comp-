import { useCallback, useEffect, useMemo, useState } from 'react';
import { isGameId } from '../games/definitions';
import { sessionReducer, type SessionAction } from '../engine/session';
import type { GameSession } from '../types/session';
import { STORAGE_KEYS, readStored, removeStored, writeStored } from '../utils/persistence';
import { isGameSession } from '../utils/validation';

interface Loaded {
  session: GameSession | null;
  restored: boolean;
}

/** Restores an unfinished session after a refresh. A running clock is paused so no time is lost unseen. */
function loadSession(): Loaded {
  const stored = readStored<GameSession | null>(STORAGE_KEYS.session, (v): v is GameSession | null => isGameSession(v), null);
  if (!stored || !isGameId(stored.gameId) || stored.status === 'finished') return { session: null, restored: false };
  if (stored.status === 'playing' && stored.timer.endsAt !== null) {
    const remaining = Math.max(0, stored.timer.endsAt - Date.now());
    return {
      session: {
        ...stored,
        status: remaining > 0 ? 'paused' : 'timeUp',
        timer: { ...stored.timer, remainingMs: remaining, endsAt: null },
      },
      restored: true,
    };
  }
  return { session: stored, restored: true };
}

export interface GameSessionApi {
  session: GameSession | null;
  restored: boolean;
  dispatch: (action: SessionAction) => void;
  start: (session: GameSession) => void;
  clear: () => void;
}

export function useGameSession(): GameSessionApi {
  const [initial] = useState(loadSession);
  const [session, setSession] = useState<GameSession | null>(initial.session);

  useEffect(() => {
    if (session && session.status !== 'finished') writeStored(STORAGE_KEYS.session, session);
    else removeStored(STORAGE_KEYS.session);
  }, [session]);

  const dispatch = useCallback((action: SessionAction) => {
    setSession((previous) => (previous ? sessionReducer(previous, action) : previous));
  }, []);
  const start = useCallback((next: GameSession) => setSession(next), []);
  const clear = useCallback(() => setSession(null), []);

  return useMemo(() => ({ session, restored: initial.restored, dispatch, start, clear }), [session, initial.restored, dispatch, start, clear]);
}
