import { CHARADES_POINTS } from '../games/emiratiCharades/content';
import { CULTURE_POINTS } from '../games/cultureSportsChallenge/content';
import { EXPEDITION_POINTS } from '../games/desertExpedition/content';
import { FOOTBALL_POINTS } from '../games/football/content';
import { RIDDLE_POINTS } from '../games/heritageRiddleRelay/content';
import type { CultureCategory, Difficulty, GameContent } from '../types/content';
import type { GameDefinition, GameId, PlayMode } from '../types/game';
import type { GameSession, HistoryRecord, Player, Roster, Team } from '../types/session';
import { createId } from './id';

export const MAX_NAME_LENGTH = 20;

/* ---------- Player and team setup ---------- */

export interface SetupValidation {
  valid: boolean;
  errors: string[];
  playerErrors: Record<string, string>;
  teamErrors: Record<string, string>;
}

export function validateSetup(game: GameDefinition, mode: PlayMode, players: Player[], teams: Team[]): SetupValidation {
  const errors: string[] = [];
  const playerErrors: Record<string, string> = {};
  const teamErrors: Record<string, string> = {};
  const limits = game.limits[mode];

  if (!limits) {
    return { valid: false, errors: [`${game.name} cannot be played in ${mode} mode.`], playerErrors, teamErrors };
  }

  const seenNames = new Map<string, string>();
  for (const player of players) {
    const name = player.name.trim();
    if (!name) playerErrors[player.id] = 'Enter a name.';
    else if (name.length > MAX_NAME_LENGTH) playerErrors[player.id] = `Use ${MAX_NAME_LENGTH} characters or fewer.`;
    else {
      const key = name.toLowerCase();
      if (seenNames.has(key)) playerErrors[player.id] = 'This name is already used.';
      else seenNames.set(key, player.id);
    }
  }
  if (Object.keys(playerErrors).length) errors.push('Fix the highlighted player names. Every player needs a unique name.');

  if (players.length < limits.minPlayers) {
    errors.push(`${game.name} needs at least ${limits.minPlayers} players${mode === 'team' ? '' : ' in individual mode'}. Add ${limits.minPlayers - players.length} more.`);
  }
  if (players.length > limits.maxPlayers) {
    errors.push(`${game.name} allows at most ${limits.maxPlayers} players. Remove ${players.length - limits.maxPlayers}.`);
  }

  if (mode === 'team') {
    const minTeams = limits.minTeams ?? 2;
    const maxTeams = limits.maxTeams ?? 4;
    if (teams.length < minTeams) errors.push(`${game.name} needs at least ${minTeams} teams.`);
    if (teams.length > maxTeams) {
      errors.push(
        maxTeams === minTeams
          ? `${game.name} is played with exactly ${maxTeams} teams. Remove ${teams.length - maxTeams} team${teams.length - maxTeams === 1 ? '' : 's'}.`
          : `${game.name} allows at most ${maxTeams} teams.`,
      );
    }

    const seenTeams = new Set<string>();
    for (const team of teams) {
      const name = team.name.trim();
      if (!name) teamErrors[team.id] = 'Enter a team name.';
      else if (name.length > MAX_NAME_LENGTH) teamErrors[team.id] = `Use ${MAX_NAME_LENGTH} characters or fewer.`;
      else if (seenTeams.has(name.toLowerCase())) teamErrors[team.id] = 'Team names must be different.';
      else seenTeams.add(name.toLowerCase());
    }

    const teamIds = new Set(teams.map((t) => t.id));
    const unassigned = players.filter((p) => !p.teamId || !teamIds.has(p.teamId));
    for (const player of unassigned) playerErrors[player.id] ??= 'Choose a team.';
    if (unassigned.length) errors.push(`Assign every player to a team (${unassigned.length} without a team).`);

    const minPerTeam = limits.minPerTeam ?? 1;
    const sizes = teams.map((team) => players.filter((p) => p.teamId === team.id).length);
    teams.forEach((team, index) => {
      if (sizes[index] < minPerTeam) {
        teamErrors[team.id] ??= `Needs at least ${minPerTeam} player${minPerTeam === 1 ? '' : 's'}.`;
      }
    });
    if (teams.some((_, index) => sizes[index] < minPerTeam)) {
      errors.push(`Every team needs at least ${minPerTeam} player${minPerTeam === 1 ? '' : 's'}.`);
    }
    if (limits.maxTeamSizeDifference !== undefined && sizes.length > 1) {
      const diff = Math.max(...sizes) - Math.min(...sizes);
      if (diff > limits.maxTeamSizeDifference) {
        errors.push(`Teams are unbalanced. ${game.name} needs teams that differ by at most ${limits.maxTeamSizeDifference} player.`);
      }
    }
    if (Object.keys(teamErrors).length && !errors.some((e) => e.startsWith('Every team') || e.startsWith('Fix the highlighted team'))) {
      errors.push('Fix the highlighted team names.');
    }
  }

  return { valid: errors.length === 0, errors: [...new Set(errors)], playerErrors, teamErrors };
}

/* ---------- AI content validation ---------- */

const BLOCKED_TERMS =
  /\b(kill|killing|blood|bloody|gun|guns|weapon|weapons|knife|bomb|alcohol|beer|wine|gamble|gambling|casino|drugs?|cigarettes?|smoking|dating|boyfriend|girlfriend|sexy|stupid|idiot|ugly|hate)\b/i;

const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard'];
const CULTURE_CATEGORIES: CultureCategory[] = ['Sports', 'UAE Culture', 'Teamwork', 'Creative', 'General Knowledge'];

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (!trimmed || trimmed.length > max || BLOCKED_TERMS.test(trimmed)) return null;
  return trimmed;
}

function optionalText(value: unknown, max: number): string | undefined {
  return value === undefined || value === null || value === '' ? undefined : (text(value, max) ?? undefined);
}

function textList(value: unknown, min: number, max: number, maxLength: number): string[] | null {
  if (!Array.isArray(value) || value.length < min || value.length > max) return null;
  const items = value.map((item) => text(item, maxLength));
  return items.every((item): item is string => item !== null) ? items : null;
}

function difficulty(value: unknown): Difficulty {
  return DIFFICULTIES.includes(value as Difficulty) ? (value as Difficulty) : 'Medium';
}

export type ContentValidationResult = { ok: true; item: GameContent } | { ok: false; reason: string };

/** Validates and normalises a live AI response into a game-specific content item. */
export function validateLiveContent(gameId: GameId, raw: unknown): ContentValidationResult {
  if (!raw || typeof raw !== 'object') return { ok: false, reason: 'The AI response was empty.' };
  const r = raw as Record<string, unknown>;
  const level = difficulty(r.difficulty);
  const id = createId('live');
  const fail = (field: string): ContentValidationResult => ({
    ok: false,
    reason: `The AI response was missing a suitable ${field}, so it was not used.`,
  });

  switch (gameId) {
    case 'football': {
      const title = text(r.title, 60);
      const instruction = text(r.instruction, 260);
      const successCriteria = text(r.successCriteria, 220);
      if (!title) return fail('title');
      if (!instruction) return fail('instruction');
      if (!successCriteria) return fail('success rule');
      return {
        ok: true,
        item: { id, gameId, origin: 'live', title, instruction, successCriteria, category: text(r.category, 30) ?? 'Team Mission', difficulty: level, points: FOOTBALL_POINTS[level] },
      };
    }
    case 'heritageRiddleRelay': {
      const title = text(r.title, 60);
      const riddle = text(r.riddle, 340);
      const answer = text(r.answer, 60);
      const explanation = text(r.explanation, 320);
      const hint = text(r.hint, 160);
      if (!title) return fail('title');
      if (!riddle) return fail('riddle');
      if (!answer) return fail('answer');
      if (!hint) return fail('hint');
      if (!explanation) return fail('explanation');
      return {
        ok: true,
        item: { id, gameId, origin: 'live', title, riddle, answer, explanation, hint, topic: text(r.topic, 40) ?? 'UAE heritage', difficulty: level, points: RIDDLE_POINTS[level] },
      };
    }
    case 'desertExpedition': {
      const title = text(r.title, 60);
      const scenario = text(r.scenario, 420);
      const challenge = text(r.challenge, 220);
      const choices = textList(r.choices, 2, 4, 120);
      const hostGuidance = text(r.hostGuidance, 340);
      const scoringCriteria = textList(r.scoringCriteria, 1, 4, 120);
      if (!title) return fail('title');
      if (!scenario) return fail('story scenario');
      if (!challenge) return fail('challenge');
      if (!choices) return fail('set of choices');
      if (!hostGuidance) return fail('host guidance');
      if (!scoringCriteria) return fail('scoring criteria');
      const suggested = typeof r.suggestedChoice === 'number' && Number.isInteger(r.suggestedChoice) && r.suggestedChoice >= 0 && r.suggestedChoice < choices.length ? r.suggestedChoice : null;
      return {
        ok: true,
        item: { id, gameId, origin: 'live', title, scenario, challenge, choices, suggestedChoice: suggested, hostGuidance, scoringCriteria, followUp: optionalText(r.followUp, 180), difficulty: level, points: EXPEDITION_POINTS[level] },
      };
    }
    case 'emiratiCharades': {
      const prompt = text(r.prompt, 60);
      const actingTip = text(r.actingTip, 160);
      if (!prompt || prompt.split(' ').length > 7) return fail('prompt');
      if (!actingTip) return fail('acting tip');
      return {
        ok: true,
        item: { id, gameId, origin: 'live', title: prompt, prompt, actingTip, category: text(r.category, 30) ?? 'UAE Themes', difficulty: level, points: CHARADES_POINTS[level] },
      };
    }
    case 'cultureSportsChallenge': {
      const prompt = text(r.prompt, 220);
      const answer = text(r.answer, 200);
      if (!prompt) return fail('question');
      if (!answer) return fail('answer');
      const category = CULTURE_CATEGORIES.includes(r.category as CultureCategory) ? (r.category as CultureCategory) : 'General Knowledge';
      return {
        ok: true,
        item: {
          id,
          gameId,
          origin: 'live',
          title: text(r.title, 60) ?? category,
          category,
          kind: r.kind === 'task' ? 'task' : 'question',
          prompt,
          answer,
          hint: optionalText(r.hint, 140),
          difficulty: level,
          points: CULTURE_POINTS[level],
        },
      };
    }
  }
}

/* ---------- Stored data guards ---------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isPlayer(value: unknown): value is Player {
  return isRecord(value) && typeof value.id === 'string' && typeof value.name === 'string' && (value.teamId === null || typeof value.teamId === 'string');
}

export function isTeam(value: unknown): value is Team {
  return isRecord(value) && typeof value.id === 'string' && typeof value.name === 'string';
}

export function isRoster(value: unknown): value is Roster {
  return isRecord(value) && Array.isArray(value.players) && value.players.every(isPlayer) && Array.isArray(value.teams) && value.teams.every(isTeam);
}

export function isGameSession(value: unknown): value is GameSession {
  return (
    isRecord(value) &&
    value.version === 1 &&
    typeof value.id === 'string' &&
    typeof value.gameId === 'string' &&
    typeof value.status === 'string' &&
    Array.isArray(value.players) &&
    value.players.every(isPlayer) &&
    Array.isArray(value.participants) &&
    value.participants.length > 0 &&
    Array.isArray(value.events) &&
    isRecord(value.timer) &&
    isRecord(value.settings) &&
    isRecord(value.reveal) &&
    typeof value.round === 'number' &&
    typeof value.turnIndex === 'number' &&
    value.turnIndex < value.participants.length
  );
}

export function isHistoryRecord(value: unknown): value is HistoryRecord {
  return (
    isRecord(value) &&
    value.version === 1 &&
    typeof value.id === 'string' &&
    typeof value.gameId === 'string' &&
    typeof value.gameName === 'string' &&
    typeof value.finishedAt === 'number' &&
    Array.isArray(value.standings) &&
    Array.isArray(value.participants) &&
    Array.isArray(value.roundScores) &&
    isRecord(value.outcome) &&
    isRecord(value.stats)
  );
}
