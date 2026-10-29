import { cultureChallenges } from '../games/cultureSportsChallenge/content';
import { expeditionScenarios } from '../games/desertExpedition/content';
import { charadePrompts } from '../games/emiratiCharades/content';
import { footballMissions } from '../games/football/content';
import { heritageRiddles } from '../games/heritageRiddleRelay/content';
import type { GameContent } from '../types/content';
import type { GameId } from '../types/game';
import type { GameSession } from '../types/session';

const PREPARED_POOLS: Record<GameId, GameContent[]> = {
  football: footballMissions,
  heritageRiddleRelay: heritageRiddles,
  desertExpedition: expeditionScenarios,
  emiratiCharades: charadePrompts,
  cultureSportsChallenge: cultureChallenges,
};

export function getPreparedPool(gameId: GameId): GameContent[] {
  return PREPARED_POOLS[gameId];
}

export function pickPrepared(gameId: GameId, excludeIds: Iterable<string>): GameContent | null {
  const exclude = new Set(excludeIds);
  const available = PREPARED_POOLS[gameId].filter((item) => !exclude.has(item.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * Draws the next prepared item for a session without repeating anything already used.
 * Returns null when the pool is exhausted and the host has not chosen to allow repeats.
 */
export function drawPreparedForSession(
  session: Pick<GameSession, 'gameId' | 'usedContentIds' | 'content' | 'settings'>,
  allowRepeats = session.settings.allowRepeats,
): GameContent | null {
  const currentId = session.content?.id;
  if (!allowRepeats) {
    return pickPrepared(session.gameId, currentId ? [...session.usedContentIds, currentId] : session.usedContentIds);
  }
  return pickPrepared(session.gameId, currentId ? [currentId] : []) ?? pickPrepared(session.gameId, []);
}

export function countUnusedPrepared(session: Pick<GameSession, 'gameId' | 'usedContentIds'>): number {
  const used = new Set(session.usedContentIds);
  return PREPARED_POOLS[session.gameId].filter((item) => !used.has(item.id)).length;
}
