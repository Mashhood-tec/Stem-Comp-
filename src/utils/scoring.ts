import type { GameId } from '../types/game';
import type {
  EventKind,
  Outcome,
  Participant,
  RoundScore,
  ScoreEvent,
  SessionStats,
  Standing,
} from '../types/session';

/** Game-specific scoring rules. Each game defines its own rewards, penalties and limits. */
export const SCORING = {
  football: { goal: 1, missionStar: 1 },
  heritageRiddleRelay: { hintPenalty: 1, minPoints: 1 },
  desertExpedition: {
    levels: [
      { id: 'strong', label: 'Strong reasoning', points: 3 },
      { id: 'good', label: 'Good reasoning', points: 2 },
      { id: 'some', label: 'Some reasoning', points: 1 },
      { id: 'none', label: 'No clear decision', points: 0 },
    ],
    followUpBonus: 1,
  },
  emiratiCharades: { saidAnswerPenalty: -1, maxSkipsPerTurn: 2 },
  cultureSportsChallenge: { hintPenalty: 1, minPoints: 1 },
} as const;

export const RESULT_KINDS: EventKind[] = ['correct', 'incorrect', 'skip', 'timeout', 'mission'];

export function pointsAfterHint(points: number, hintUsed: boolean, penalty: number, minimum: number): number {
  return hintUsed ? Math.max(minimum, points - penalty) : points;
}

export function activeEvents(events: ScoreEvent[]): ScoreEvent[] {
  return events.filter((event) => !event.reversed);
}

export function computeStandings(participants: Participant[], events: ScoreEvent[]): Standing[] {
  const active = activeEvents(events);
  return participants.map((participant) => {
    const own = active.filter((event) => event.participantId === participant.id);
    const count = (kind: EventKind) => own.filter((event) => event.kind === kind).length;
    return {
      participantId: participant.id,
      name: participant.name,
      score: own.reduce((sum, event) => sum + event.points, 0),
      correct: count('correct'),
      incorrect: count('incorrect'),
      skipped: count('skip'),
      unanswered: count('timeout'),
      penalties: count('penalty'),
      goals: count('goal'),
      missions: count('mission'),
      shootout: own.filter((event) => event.kind === 'shootout' && event.scored).length,
      wonTiebreak: count('tiebreak') > 0,
    };
  });
}

export function rankStandings(standings: Standing[]): Standing[] {
  return [...standings].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

export function computeRoundScores(participants: Participant[], events: ScoreEvent[], rounds: number): RoundScore[] {
  const active = activeEvents(events);
  const lastRound = Math.max(rounds, ...active.map((event) => event.round), 1);
  const result: RoundScore[] = [];
  for (let round = 1; round <= lastRound; round += 1) {
    const scores: Record<string, number> = {};
    for (const participant of participants) {
      scores[participant.id] = active
        .filter((event) => event.round === round && event.participantId === participant.id)
        .reduce((sum, event) => sum + event.points, 0);
    }
    result.push({ round, scores });
  }
  return result;
}

/** Applies the selected game's winning condition and tie-break order. Never invents a winner on equal scores. */
export function determineOutcome(gameId: GameId, standings: Standing[]): Outcome {
  if (standings.length === 0) return { type: 'tie', participantIds: [] };
  const top = Math.max(...standings.map((s) => s.score));
  const leaders = standings.filter((s) => s.score === top);
  if (leaders.length === 1) return { type: 'win', winnerIds: [leaders[0].participantId], decidedBy: 'score' };

  if (gameId === 'football') {
    const topStars = Math.max(...leaders.map((s) => s.missions));
    const starLeaders = leaders.filter((s) => s.missions === topStars);
    if (starLeaders.length === 1) {
      return { type: 'win', winnerIds: [starLeaders[0].participantId], decidedBy: 'missionStars' };
    }
    const topKicks = Math.max(...starLeaders.map((s) => s.shootout));
    const kickLeaders = starLeaders.filter((s) => s.shootout === topKicks);
    if (topKicks > 0 && kickLeaders.length === 1) {
      return { type: 'win', winnerIds: [kickLeaders[0].participantId], decidedBy: 'shootout' };
    }
    return { type: 'tie', participantIds: starLeaders.map((s) => s.participantId) };
  }

  const tiebreakWinners = leaders.filter((s) => s.wonTiebreak);
  if (tiebreakWinners.length === 1) {
    return { type: 'win', winnerIds: [tiebreakWinners[0].participantId], decidedBy: 'tiebreak' };
  }
  return { type: 'tie', participantIds: leaders.map((s) => s.participantId) };
}

export function computeStats(events: ScoreEvent[], usedContentIds: string[]): SessionStats {
  const active = activeEvents(events).filter((event) => event.turnKey !== 'tiebreak');
  const count = (kind: EventKind) => active.filter((event) => event.kind === kind).length;
  const liveAiItems = usedContentIds.filter((id) => id.startsWith('live-')).length;
  return {
    challengesCompleted: count('correct') + count('incorrect') + count('timeout') + count('mission'),
    correct: count('correct'),
    incorrect: count('incorrect'),
    skipped: count('skip'),
    unanswered: count('timeout'),
    penalties: count('penalty'),
    goals: count('goal'),
    missionsCompleted: count('mission'),
    liveAiItems,
    preparedItems: usedContentIds.length - liveAiItems,
  };
}

export function describeDecidedBy(outcome: Outcome): string {
  if (outcome.type === 'tie') return 'Scores level — recorded as a tie';
  switch (outcome.decidedBy) {
    case 'score':
      return 'Highest score';
    case 'missionStars':
      return 'Won on mission stars (tie-break)';
    case 'shootout':
      return 'Won the penalty shootout (tie-break)';
    case 'tiebreak':
      return 'Won the sudden-death tie-break';
  }
}
