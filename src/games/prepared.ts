import type { ContentFor, Difficulty } from '../types/content';
import type { GameId } from '../types/game';

type PreparedInput<G extends GameId> = Omit<ContentFor<G>, 'id' | 'gameId' | 'origin' | 'points'> & {
  points?: number;
};

/**
 * Wraps the AI-created content written for this project with stable IDs, its game,
 * the "prepared" origin label and difficulty-based point values.
 */
export function definePrepared<G extends GameId>(
  gameId: G,
  prefix: string,
  pointsByDifficulty: Record<Difficulty, number>,
  items: PreparedInput<G>[],
): ContentFor<G>[] {
  return items.map(
    (item, index) =>
      ({
        ...item,
        id: `${prefix}-${String(index + 1).padStart(2, '0')}`,
        gameId,
        origin: 'prepared',
        points: item.points ?? pointsByDifficulty[item.difficulty],
      }) as unknown as ContentFor<G>,
  );
}
