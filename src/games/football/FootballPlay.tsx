import { Check, CircleCheck, Flag, Play, Plus, SkipForward, Star, Undo2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ChallengeCard } from '../../components/ChallengeCard';
import { useConfirm } from '../../components/ConfirmationDialog';
import { GameTimer } from '../../components/GameTimer';
import { PauseResumeButton, TimeUpBanner } from '../../components/session/SessionParts';
import { useToast } from '../../components/Toast';
import { hasRecordedContent } from '../../engine/session';
import type { FootballMission } from '../../types/content';
import type { Participant } from '../../types/session';
import { ordinal } from '../../utils/format';
import { SCORING, activeEvents, computeStandings } from '../../utils/scoring';
import type { PlayProps } from '../types';

const GOAL_COOLDOWN_MS = 1500;

export function FootballPlay({ session, game, dispatch, remainingMs, drawNext, generator }: PlayProps) {
  const confirm = useConfirm();
  const toast = useToast();
  const [cooldown, setCooldown] = useState<Record<string, boolean>>({});
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const mission = session.content as FootballMission | null;
  const standings = computeStandings(session.participants, session.events);
  const { status } = session;
  const canScore = status === 'playing' || status === 'paused' || status === 'timeUp';
  const lastPeriod = session.round >= session.settings.totalRounds;
  const goals = activeEvents(session.events).filter((e) => e.kind === 'goal');

  const recordGoal = (team: Participant) => {
    if (!canScore || cooldown[team.id]) return;
    dispatch({ type: 'record', now: Date.now(), event: { participantId: team.id, kind: 'goal', points: SCORING.football.goal, note: 'Goal confirmed by host' } });
    toast.success(`Goal for ${team.name}!`);
    setCooldown((c) => ({ ...c, [team.id]: true }));
    timers.current.push(window.setTimeout(() => setCooldown((c) => ({ ...c, [team.id]: false })), GOAL_COOLDOWN_MS));
  };

  const undoLastGoal = async () => {
    const last = goals[goals.length - 1];
    if (!last) return;
    const team = session.participants.find((p) => p.id === last.participantId);
    const ok = await confirm({
      title: 'Undo the last goal?',
      message: `This removes the most recent goal for ${team?.name ?? 'a team'} (${ordinal(session.round)} period). Use this only if it was recorded by mistake.`,
      confirmLabel: 'Undo goal',
      tone: 'danger',
    });
    if (ok) {
      dispatch({ type: 'reverse', eventId: last.id });
      toast.info(`Goal removed from ${team?.name ?? 'the team'}.`);
    }
  };

  const completeMission = (team: Participant) => {
    if (!mission || !canScore) return;
    dispatch({
      type: 'record',
      now: Date.now(),
      event: { participantId: team.id, kind: 'mission', points: 0, contentId: mission.id, contentTitle: mission.title, note: 'Mission star earned' },
    });
    toast.success(`${team.name} completed "${mission.title}"!`);
  };

  const anyCompleted = mission ? session.participants.some((p) => hasRecordedContent(session, mission.id, p.id)) : false;

  const nextMission = () => {
    const next = drawNext();
    if (mission && canScore && !anyCompleted) {
      dispatch({
        type: 'record',
        now: Date.now(),
        event: { participantId: null, kind: 'skip', points: 0, contentId: mission.id, contentTitle: mission.title, note: 'Mission skipped' },
        nextContent: next,
      });
    } else {
      dispatch({ type: 'setContent', content: next });
    }
  };

  const primary = (() => {
    if (status === 'ready') {
      return (
        <button type="button" className="btn btn-primary btn-lg" onClick={() => dispatch({ type: 'startTurn', now: Date.now() })}>
          <Play size={18} aria-hidden="true" /> {session.round === 1 ? 'Kick Off' : `Start ${ordinal(session.round)} Period`}
        </button>
      );
    }
    if (status === 'timeUp' && !lastPeriod) {
      return (
        <button type="button" className="btn btn-primary btn-lg" onClick={() => dispatch({ type: 'startNextRound' })}>
          Go to {ordinal(session.round + 1)} Period
        </button>
      );
    }
    if (status === 'timeUp' && lastPeriod) {
      return (
        <button type="button" className="btn btn-primary btn-lg" onClick={() => dispatch({ type: 'endGame', now: Date.now() })}>
          <Flag size={18} aria-hidden="true" /> Full Time — Confirm Result
        </button>
      );
    }
    return <PauseResumeButton session={session} dispatch={dispatch} />;
  })();

  return (
    <div className="game-football">
      <section className="match-board" aria-label="Match scoreboard">
        {session.participants.map((team, index) => {
          const standing = standings.find((s) => s.participantId === team.id)!;
          const names = team.memberIds.map((id) => session.players.find((p) => p.id === id)?.name).filter(Boolean).join(', ');
          return (
            <div key={team.id} className={`match-team ${index === 1 ? 'is-right' : ''}`}>
              <p className="match-team-name">{team.name}</p>
              <p className="match-members">{names}</p>
              <p className="match-score" aria-live="polite" aria-label={`${team.name} ${standing.goals} goals`}>
                {standing.score}
              </p>
              <p className="match-stars">
                <Star size={13} aria-hidden="true" /> {standing.missions} mission star{standing.missions === 1 ? '' : 's'}
              </p>
              <button
                type="button"
                className={`btn ${cooldown[team.id] ? 'btn-accent' : 'btn-secondary'} btn-block goal-btn`}
                onClick={() => recordGoal(team)}
                disabled={!canScore || cooldown[team.id]}
                aria-label={`Record a goal for ${team.name}`}
              >
                {cooldown[team.id] ? (
                  <>
                    <Check size={17} aria-hidden="true" /> Goal recorded
                  </>
                ) : (
                  <>
                    <Plus size={17} aria-hidden="true" /> Goal
                  </>
                )}
              </button>
            </div>
          );
        })}
        <div className="match-center">
          <p className="match-period">
            {ordinal(session.round)} period of {session.settings.totalRounds}
          </p>
          <GameTimer remainingMs={remainingMs} durationMs={session.timer.durationMs} status={status} label="Match clock" />
          <p className="match-status">
            {status === 'ready' && (session.round === 1 ? 'Waiting for kick-off' : 'Teams changing ends')}
            {status === 'playing' && 'Match in play'}
            {status === 'paused' && 'Match paused'}
            {status === 'timeUp' && (lastPeriod ? 'Full time' : 'End of period')}
          </p>
        </div>
      </section>

      {status === 'timeUp' && (
        <TimeUpBanner>
          {lastPeriod
            ? 'Final whistle! Check the score is correct, record any last goal, then confirm the result.'
            : `End of the ${ordinal(session.round)} period. Take a short break, then start the next period.`}
        </TimeUpBanner>
      )}

      <div className="host-controls">
        {primary}
        <button type="button" className="btn btn-ghost" onClick={() => void undoLastGoal()} disabled={goals.length === 0}>
          <Undo2 size={16} aria-hidden="true" /> Undo Last Goal
        </button>
        {!canScore && status === 'ready' && <p className="muted small">Goals can be recorded once the match has kicked off.</p>}
      </div>

      <ChallengeCard
        label={game.contentLabel}
        content={mission}
        generator={generator}
        canGenerate
        actions={
          mission && (
            <div className="btn-row">
              {session.participants.map((team) => {
                const done = hasRecordedContent(session, mission.id, team.id);
                return (
                  <button
                    key={team.id}
                    type="button"
                    className={`btn ${done ? 'btn-accent' : 'btn-secondary'} btn-sm`}
                    onClick={() => completeMission(team)}
                    disabled={done || !canScore}
                    aria-pressed={done}
                  >
                    <CircleCheck size={15} aria-hidden="true" /> {done ? `${team.name} completed` : `${team.name} completed it`}
                  </button>
                );
              })}
              <button type="button" className="btn btn-ghost btn-sm" onClick={nextMission}>
                <SkipForward size={15} aria-hidden="true" /> {anyCompleted ? 'Next Mission' : 'Skip Mission'}
              </button>
            </div>
          )
        }
      >
        {mission && (
          <div className="mission">
            <span className="chip chip-outline">{mission.category}</span>
            <p className="challenge-text">{mission.instruction}</p>
            <div className="host-note-box">
              <p className="host-note-label">How the host decides</p>
              <p>{mission.successCriteria}</p>
            </div>
            <p className="muted small">Completing a mission earns a mission star. If goals are level at full time, mission stars decide the winner.</p>
          </div>
        )}
      </ChallengeCard>
    </div>
  );
}
