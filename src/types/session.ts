import type { GameContent } from './content';
import type { GameId, PlayMode } from './game';

export interface Player {
  id: string;
  name: string;
  teamId: string | null;
}

export interface Team {
  id: string;
  name: string;
}

export interface Roster {
  players: Player[];
  teams: Team[];
}

/** A scoring unit: a team in team mode, or a single player in individual mode. */
export interface Participant {
  id: string;
  name: string;
  memberIds: string[];
}

export type SessionStatus =
  | 'ready'
  | 'playing'
  | 'paused'
  | 'timeUp'
  | 'turnComplete'
  | 'roundComplete'
  | 'review'
  | 'tiebreak'
  | 'finished';

export type EventKind =
  | 'correct'
  | 'incorrect'
  | 'skip'
  | 'timeout'
  | 'goal'
  | 'penalty'
  | 'bonus'
  | 'adjust'
  | 'mission'
  | 'shootout'
  | 'tiebreak';

export interface ScoreEvent {
  id: string;
  at: number;
  round: number;
  turnKey: string;
  participantId: string | null;
  playerId?: string | null;
  kind: EventKind;
  points: number;
  contentId?: string;
  contentTitle?: string;
  note: string;
  /** For shootout kicks. */
  scored?: boolean;
  reversed?: boolean;
}

export interface TimerState {
  durationMs: number;
  remainingMs: number;
  /** Epoch ms when the countdown reaches zero; null while stopped or paused. */
  endsAt: number | null;
}

export interface SessionSettings {
  turnSeconds: number;
  totalRounds: number;
  allowRepeats: boolean;
}

export interface RevealState {
  hint: boolean;
  answer: boolean;
  prompt: boolean;
  guidance: boolean;
  choice: number | null;
}

export interface TiebreakState {
  kind: 'challenge' | 'shootout';
  participantIds: string[];
  content: GameContent | null;
}

export type Outcome =
  | {
      type: 'win';
      winnerIds: string[];
      decidedBy: 'score' | 'missionStars' | 'shootout' | 'tiebreak';
    }
  | { type: 'tie'; participantIds: string[] };

export interface GameSession {
  version: 1;
  id: string;
  gameId: GameId;
  mode: PlayMode;
  players: Player[];
  teams: Team[];
  participants: Participant[];
  settings: SessionSettings;
  status: SessionStatus;
  round: number;
  turnIndex: number;
  timer: TimerState;
  content: GameContent | null;
  usedContentIds: string[];
  reveal: RevealState;
  events: ScoreEvent[];
  tiebreak: TiebreakState | null;
  acceptedTie: boolean;
  createdAt: number;
  startedAt: number | null;
  finishedAt: number | null;
  outcome: Outcome | null;
}

export interface Standing {
  participantId: string;
  name: string;
  score: number;
  correct: number;
  incorrect: number;
  skipped: number;
  unanswered: number;
  penalties: number;
  goals: number;
  missions: number;
  shootout: number;
  wonTiebreak: boolean;
}

export interface RoundScore {
  round: number;
  scores: Record<string, number>;
}

export interface SessionStats {
  challengesCompleted: number;
  correct: number;
  incorrect: number;
  skipped: number;
  unanswered: number;
  penalties: number;
  goals: number;
  missionsCompleted: number;
  liveAiItems: number;
  preparedItems: number;
}

export interface HistoryRecord {
  version: 1;
  id: string;
  gameId: GameId;
  gameName: string;
  mode: PlayMode;
  startedAt: number;
  finishedAt: number;
  players: Player[];
  teams: Team[];
  participants: Participant[];
  settings: SessionSettings;
  standings: Standing[];
  outcome: Outcome;
  roundScores: RoundScore[];
  stats: SessionStats;
  events: ScoreEvent[];
}
