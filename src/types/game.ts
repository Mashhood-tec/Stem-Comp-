import type { LucideIcon } from 'lucide-react';

export type GameId =
  | 'football'
  | 'heritageRiddleRelay'
  | 'desertExpedition'
  | 'emiratiCharades'
  | 'cultureSportsChallenge';

export type PlayMode = 'team' | 'individual';

export interface ModeLimits {
  minPlayers: number;
  maxPlayers: number;
  minTeams?: number;
  maxTeams?: number;
  minPerTeam?: number;
  /** Largest allowed difference between the biggest and smallest team. */
  maxTeamSizeDifference?: number;
}

export interface GameRules {
  objective: string;
  howToPlay: string[];
  points: string[];
  penalties: string[];
  tieBreak: string;
  hostConfirms: string;
  winning: string;
}

export interface GameDefinition {
  id: GameId;
  name: string;
  category: string;
  description: string;
  icon: LucideIcon;
  modes: PlayMode[];
  defaultMode: PlayMode;
  quick: boolean;
  durationLabel: string;
  limits: Partial<Record<PlayMode, ModeLimits>>;
  /** Timer options in seconds. */
  timeOptions: number[];
  defaultTime: number;
  timeLabel: string;
  roundOptions: number[];
  defaultRounds: number;
  roundLabel: string;
  roundsLabel: string;
  rules: GameRules;
  aiUse: string;
  contentLabel: string;
}
