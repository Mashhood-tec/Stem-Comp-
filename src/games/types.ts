import type { GeneratorControls } from '../components/ChallengeCard';
import type { SessionAction } from '../engine/session';
import type { GameContent } from '../types/content';
import type { GameDefinition } from '../types/game';
import type { GameSession } from '../types/session';

/** Props shared by every game's play screen. Each game supplies its own rules and interactions. */
export interface PlayProps {
  session: GameSession;
  game: GameDefinition;
  dispatch: (action: SessionAction) => void;
  remainingMs: number;
  /** Next unused prepared item, or null when the pool is exhausted (unless repeats are allowed). */
  drawNext: () => GameContent | null;
  generator: GeneratorControls;
}
