import type { GameId } from './game';

export type ContentOrigin = 'prepared' | 'live';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface BaseContent {
  id: string;
  title: string;
  difficulty: Difficulty;
  points: number;
  origin: ContentOrigin;
}

export interface FootballMission extends BaseContent {
  gameId: 'football';
  category: string;
  instruction: string;
  successCriteria: string;
}

export interface HeritageRiddle extends BaseContent {
  gameId: 'heritageRiddleRelay';
  topic: string;
  riddle: string;
  hint: string;
  answer: string;
  explanation: string;
}

export interface ExpeditionScenario extends BaseContent {
  gameId: 'desertExpedition';
  scenario: string;
  challenge: string;
  choices: string[];
  suggestedChoice: number | null;
  hostGuidance: string;
  scoringCriteria: string[];
  followUp?: string;
}

export interface CharadePrompt extends BaseContent {
  gameId: 'emiratiCharades';
  category: string;
  prompt: string;
  actingTip: string;
}

export type CultureCategory = 'Sports' | 'UAE Culture' | 'Teamwork' | 'Creative' | 'General Knowledge';

export interface CultureChallenge extends BaseContent {
  gameId: 'cultureSportsChallenge';
  category: CultureCategory;
  kind: 'question' | 'task';
  prompt: string;
  hint?: string;
  answer: string;
}

export type GameContent =
  | FootballMission
  | HeritageRiddle
  | ExpeditionScenario
  | CharadePrompt
  | CultureChallenge;

export type ContentFor<G extends GameId> = Extract<GameContent, { gameId: G }>;
