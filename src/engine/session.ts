import type { GameContent } from '../types/content';
import type { GameDefinition, GameId, PlayMode } from '../types/game';
import type {
  GameSession,
  HistoryRecord,
  Participant,
  Player,
  RevealState,
  ScoreEvent,
  SessionStatus,
  Team,
  TimerState,
} from '../types/session';
import { createId } from '../utils/id';
import {
  RESULT_KINDS,
  activeEvents,
  computeRoundScores,
  computeStandings,
  computeStats,
  determineOutcome,
} from '../utils/scoring';

export interface NewSessionConfig {
  gameId: GameId;
  mode: PlayMode;
  players: Player[];
  teams: Team[];
  turnSeconds: number;
  totalRounds: number;
}

export const EMPTY_REVEAL: RevealState = { hint: false, answer: false, prompt: false, guidance: false, choice: null };

export function buildParticipants(mode: PlayMode, players: Player[], teams: Team[]): Participant[] {
  if (mode === 'team') {
    return teams.map((team) => ({
      id: team.id,
      name: team.name.trim(),
      memberIds: players.filter((p) => p.teamId === team.id).map((p) => p.id),
    }));
  }
  return players.map((player) => ({ id: player.id, name: player.name.trim(), memberIds: [player.id] }));
}

export function createSession(config: NewSessionConfig, firstContent: GameContent | null, now = Date.now()): GameSession {
  const players = config.players.map((p) => ({ ...p, name: p.name.trim(), teamId: config.mode === 'team' ? p.teamId : null }));
  const teams = config.mode === 'team' ? config.teams.map((t) => ({ ...t, name: t.name.trim() })) : [];
  const durationMs = config.turnSeconds * 1000;
  return {
    version: 1,
    id: createId('session'),
    gameId: config.gameId,
    mode: config.mode,
    players,
    teams,
    participants: buildParticipants(config.mode, players, teams),
    settings: { turnSeconds: config.turnSeconds, totalRounds: config.totalRounds, allowRepeats: false },
    status: 'ready',
    round: 1,
    turnIndex: 0,
    timer: { durationMs, remainingMs: durationMs, endsAt: null },
    content: firstContent,
    usedContentIds: firstContent ? [firstContent.id] : [],
    reveal: EMPTY_REVEAL,
    events: [],
    tiebreak: null,
    acceptedTie: false,
    createdAt: now,
    startedAt: null,
    finishedAt: null,
    outcome: null,
  };
}

/* ---------- Actions ---------- */

export type NewEvent = Omit<ScoreEvent, 'id' | 'at' | 'round' | 'turnKey' | 'reversed'>;

export type SessionAction =
  | { type: 'startTurn'; now: number }
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number }
  | { type: 'timeUp' }
  | { type: 'setContent'; content: GameContent | null }
  | { type: 'reveal'; patch: Partial<RevealState> }
  | { type: 'record'; now: number; event: NewEvent; endTurn?: boolean; nextContent?: GameContent | null }
  | { type: 'endTurn'; now: number }
  | { type: 'reverse'; eventId: string }
  | { type: 'undoTurnResult' }
  | { type: 'nextTurn'; content: GameContent | null }
  | { type: 'startNextRound'; content?: GameContent | null }
  | { type: 'endGame'; now: number }
  | { type: 'startTiebreak'; kind: 'challenge' | 'shootout'; participantIds: string[]; content: GameContent | null }
  | { type: 'setTiebreakContent'; content: GameContent | null }
  | { type: 'closeTiebreak' }
  | { type: 'allowRepeats' }
  | { type: 'confirmResult'; now: number; acceptTie: boolean };

/* ---------- Helpers ---------- */

export function turnKeyOf(session: Pick<GameSession, 'round' | 'turnIndex'>): string {
  return `${session.round}-${session.turnIndex}`;
}

function stopTimer(timer: TimerState, now: number): TimerState {
  return {
    ...timer,
    remainingMs: timer.endsAt ? Math.max(0, timer.endsAt - now) : timer.remainingMs,
    endsAt: null,
  };
}

function resetTimer(timer: TimerState): TimerState {
  return { durationMs: timer.durationMs, remainingMs: timer.durationMs, endsAt: null };
}

function applyContent(state: GameSession, content: GameContent | null): GameSession {
  return {
    ...state,
    content,
    reveal: EMPTY_REVEAL,
    usedContentIds: content && !state.usedContentIds.includes(content.id) ? [...state.usedContentIds, content.id] : state.usedContentIds,
  };
}

const RECORDABLE: SessionStatus[] = ['playing', 'paused', 'timeUp'];
export const ADJUSTABLE: SessionStatus[] = ['ready', 'playing', 'paused', 'timeUp', 'turnComplete', 'roundComplete', 'review'];

function isDuplicate(state: GameSession, event: NewEvent, turnKey: string): boolean {
  if (!event.contentId) return false;
  return state.events.some((existing) => {
    if (existing.reversed || existing.contentId !== event.contentId) return false;
    if (existing.participantId !== event.participantId) return false;
    if (event.kind === 'bonus') return existing.kind === 'bonus' && existing.turnKey === turnKey;
    if (!RESULT_KINDS.includes(event.kind) || !RESULT_KINDS.includes(existing.kind)) return false;
    return event.kind === 'mission' || existing.turnKey === turnKey;
  });
}

/* ---------- Reducer ---------- */

export function sessionReducer(state: GameSession, action: SessionAction): GameSession {
  switch (action.type) {
    case 'startTurn': {
      if (state.status !== 'ready') return state;
      return {
        ...state,
        status: 'playing',
        startedAt: state.startedAt ?? action.now,
        timer: { ...state.timer, remainingMs: state.timer.durationMs, endsAt: action.now + state.timer.durationMs },
      };
    }
    case 'pause': {
      if (state.status !== 'playing') return state;
      return { ...state, status: 'paused', timer: stopTimer(state.timer, action.now) };
    }
    case 'resume': {
      if (state.status !== 'paused') return state;
      if (state.timer.remainingMs <= 0) return { ...state, status: 'timeUp' };
      return { ...state, status: 'playing', timer: { ...state.timer, endsAt: action.now + state.timer.remainingMs } };
    }
    case 'timeUp': {
      if (state.status !== 'playing') return state;
      return { ...state, status: 'timeUp', timer: { ...state.timer, remainingMs: 0, endsAt: null } };
    }
    case 'setContent': {
      if (state.status === 'review' || state.status === 'finished') return state;
      return applyContent(state, action.content);
    }
    case 'reveal':
      return { ...state, reveal: { ...state.reveal, ...action.patch } };
    case 'record': {
      const { event } = action;
      const inTiebreak = state.status === 'tiebreak';
      const allowed =
        RECORDABLE.includes(state.status) ||
        (state.status === 'turnComplete' && event.kind === 'bonus') ||
        (event.kind === 'adjust' && ADJUSTABLE.includes(state.status)) ||
        (inTiebreak && (event.kind === 'tiebreak' || event.kind === 'shootout'));
      if (!allowed) return state;
      const turnKey = inTiebreak ? 'tiebreak' : turnKeyOf(state);
      if (isDuplicate(state, event, turnKey)) return state;

      let next: GameSession = {
        ...state,
        events: [...state.events, { ...event, id: createId('evt'), at: action.now, round: state.round, turnKey }],
      };
      if (action.endTurn && RECORDABLE.includes(state.status)) {
        next = { ...next, status: 'turnComplete', timer: stopTimer(next.timer, action.now) };
      }
      if (action.nextContent !== undefined) next = applyContent(next, action.nextContent);
      if (inTiebreak && event.kind === 'tiebreak') next = { ...next, status: 'review', tiebreak: null };
      return next;
    }
    case 'endTurn': {
      if (!RECORDABLE.includes(state.status)) return state;
      return { ...state, status: 'turnComplete', timer: stopTimer(state.timer, action.now) };
    }
    case 'reverse': {
      if (state.status === 'finished') return state;
      const target = state.events.find((e) => e.id === action.eventId);
      if (!target || target.reversed) return state;
      return { ...state, events: state.events.map((e) => (e.id === action.eventId ? { ...e, reversed: true } : e)) };
    }
    case 'undoTurnResult': {
      if (state.status !== 'turnComplete') return state;
      const key = turnKeyOf(state);
      const last = [...state.events].reverse().find((e) => !e.reversed && e.turnKey === key);
      if (!last) return state;
      const events = state.events.map((e) => (e.id === last.id ? { ...e, reversed: true } : e));
      if (last.kind === 'bonus') return { ...state, events };
      return { ...state, events, status: state.timer.remainingMs > 0 ? 'paused' : 'timeUp' };
    }
    case 'nextTurn': {
      if (state.status !== 'turnComplete') return state;
      const lastTurn = state.turnIndex >= state.participants.length - 1;
      if (lastTurn && state.round >= state.settings.totalRounds) return { ...state, status: 'review' };
      if (lastTurn) return { ...state, status: 'roundComplete' };
      return applyContent(
        { ...state, turnIndex: state.turnIndex + 1, status: 'ready', timer: resetTimer(state.timer) },
        action.content,
      );
    }
    case 'startNextRound': {
      const fromRoundEnd = state.status === 'roundComplete' || (state.gameId === 'football' && state.status === 'timeUp');
      if (!fromRoundEnd || state.round >= state.settings.totalRounds) return state;
      const advanced: GameSession = { ...state, round: state.round + 1, turnIndex: 0, status: 'ready', timer: resetTimer(state.timer) };
      return action.content === undefined ? advanced : applyContent(advanced, action.content);
    }
    case 'endGame': {
      if (state.status === 'review' || state.status === 'finished' || state.status === 'tiebreak') return state;
      return { ...state, status: 'review', timer: stopTimer(state.timer, action.now) };
    }
    case 'startTiebreak': {
      if (state.status !== 'review') return state;
      const used = action.content && !state.usedContentIds.includes(action.content.id) ? [...state.usedContentIds, action.content.id] : state.usedContentIds;
      return {
        ...state,
        status: 'tiebreak',
        reveal: EMPTY_REVEAL,
        usedContentIds: used,
        tiebreak: { kind: action.kind, participantIds: action.participantIds, content: action.content },
      };
    }
    case 'setTiebreakContent': {
      if (state.status !== 'tiebreak' || !state.tiebreak) return state;
      const used = action.content && !state.usedContentIds.includes(action.content.id) ? [...state.usedContentIds, action.content.id] : state.usedContentIds;
      return { ...state, reveal: EMPTY_REVEAL, usedContentIds: used, tiebreak: { ...state.tiebreak, content: action.content } };
    }
    case 'closeTiebreak': {
      if (state.status !== 'tiebreak') return state;
      return { ...state, status: 'review', tiebreak: null };
    }
    case 'allowRepeats':
      return { ...state, settings: { ...state.settings, allowRepeats: true } };
    case 'confirmResult': {
      if (state.status !== 'review') return state;
      const outcome = determineOutcome(state.gameId, computeStandings(state.participants, state.events));
      if (outcome.type === 'tie' && !action.acceptTie) return state;
      return { ...state, status: 'finished', finishedAt: action.now, outcome, acceptedTie: outcome.type === 'tie' };
    }
  }
}

/* ---------- Selectors ---------- */

export function currentParticipant(session: GameSession): Participant {
  return session.participants[Math.min(session.turnIndex, session.participants.length - 1)];
}

/** The player taking this turn. In team mode, players rotate through the team each round. */
export function currentPlayer(session: GameSession, participant = currentParticipant(session)): Player | undefined {
  if (participant.memberIds.length === 0) return undefined;
  const memberId = participant.memberIds[(session.round - 1) % participant.memberIds.length];
  return session.players.find((p) => p.id === memberId);
}

export function upNext(session: GameSession): { participant: Participant; round: number } | null {
  const lastTurn = session.turnIndex >= session.participants.length - 1;
  if (!lastTurn) return { participant: session.participants[session.turnIndex + 1], round: session.round };
  if (session.round < session.settings.totalRounds) return { participant: session.participants[0], round: session.round + 1 };
  return null;
}

export function isFinalTurn(session: GameSession): boolean {
  return session.turnIndex >= session.participants.length - 1 && session.round >= session.settings.totalRounds;
}

export function currentTurnEvents(session: GameSession): ScoreEvent[] {
  const key = turnKeyOf(session);
  return activeEvents(session.events).filter((e) => e.turnKey === key);
}

export function hasRecordedContent(session: GameSession, contentId: string | undefined, participantId?: string): boolean {
  if (!contentId) return false;
  const key = turnKeyOf(session);
  return session.events.some(
    (e) =>
      !e.reversed &&
      e.contentId === contentId &&
      RESULT_KINDS.includes(e.kind) &&
      (participantId === undefined || e.participantId === participantId) &&
      (e.kind === 'mission' || e.turnKey === key),
  );
}

export function participantName(session: Pick<GameSession, 'participants'>, id: string | null | undefined): string {
  return session.participants.find((p) => p.id === id)?.name ?? 'Everyone';
}

export function buildHistoryRecord(session: GameSession, game: GameDefinition): HistoryRecord | null {
  if (session.status !== 'finished' || !session.outcome) return null;
  const standings = computeStandings(session.participants, session.events);
  return {
    version: 1,
    id: session.id,
    gameId: session.gameId,
    gameName: game.name,
    mode: session.mode,
    startedAt: session.startedAt ?? session.createdAt,
    finishedAt: session.finishedAt ?? Date.now(),
    players: session.players,
    teams: session.teams,
    participants: session.participants,
    settings: session.settings,
    standings,
    outcome: session.outcome,
    roundScores: computeRoundScores(session.participants, session.events, session.round),
    stats: computeStats(session.events, session.usedContentIds),
    events: session.events,
  };
}
