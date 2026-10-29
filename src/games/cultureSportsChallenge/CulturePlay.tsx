import { CircleCheck, CircleX, Eye, EyeOff, Lightbulb, Play, SkipForward, Square } from 'lucide-react';
import { ChallengeCard } from '../../components/ChallengeCard';
import { formatPoints } from '../../components/EventLog';
import { GameTimer } from '../../components/GameTimer';
import { PauseResumeButton, RoundCompletePanel, TimeUpBanner, TurnCompletePanel, TurnHeader } from '../../components/session/SessionParts';
import { currentParticipant, currentPlayer, currentTurnEvents } from '../../engine/session';
import type { CultureChallenge } from '../../types/content';
import type { EventKind, ScoreEvent } from '../../types/session';
import { formatDuration } from '../../utils/format';
import { SCORING, pointsAfterHint } from '../../utils/scoring';
import type { PlayProps } from '../types';

const RESULT_LABEL: Partial<Record<EventKind, string>> = { correct: 'Correct', incorrect: 'Incorrect', skip: 'Passed', timeout: 'Not in time' };

function TurnTally({ events }: { events: ScoreEvent[] }) {
  const count = (kind: EventKind) => events.filter((e) => e.kind === kind).length;
  const total = events.reduce((sum, e) => sum + e.points, 0);
  return (
    <dl className="tally" aria-label="This turn so far">
      <div>
        <dt>Correct</dt>
        <dd>{count('correct')}</dd>
      </div>
      <div>
        <dt>Incorrect</dt>
        <dd>{count('incorrect')}</dd>
      </div>
      <div>
        <dt>Passed</dt>
        <dd>{count('skip')}</dd>
      </div>
      <div>
        <dt>Points</dt>
        <dd>{total}</dd>
      </div>
    </dl>
  );
}

export function CulturePlay(props: PlayProps) {
  const { session, game, dispatch, remainingMs, drawNext, generator } = props;
  const challenge = session.content as CultureChallenge | null;
  const participant = currentParticipant(session);
  const player = currentPlayer(session, participant);
  const { status, reveal } = session;
  const inTurn = status === 'playing' || status === 'paused' || status === 'timeUp';
  const { hintPenalty, minPoints } = SCORING.cultureSportsChallenge;
  const reward = challenge ? pointsAfterHint(challenge.points, reveal.hint, hintPenalty, minPoints) : 0;
  const turnEvents = currentTurnEvents(session);

  if (status === 'roundComplete') return <RoundCompletePanel session={session} game={game} dispatch={dispatch} drawNext={drawNext} />;

  const record = (kind: EventKind) => {
    if (!challenge) return;
    const endTurn = status === 'timeUp';
    dispatch({
      type: 'record',
      now: Date.now(),
      endTurn,
      nextContent: endTurn ? undefined : drawNext(),
      event: {
        participantId: participant.id,
        playerId: player?.id ?? null,
        kind,
        points: kind === 'correct' ? reward : 0,
        contentId: challenge.id,
        contentTitle: challenge.kind === 'task' ? challenge.title : challenge.prompt.length > 48 ? `${challenge.prompt.slice(0, 47).trimEnd()}…` : challenge.prompt,
        note: kind === 'correct' && reveal.hint ? 'Answered with hint' : (RESULT_LABEL[kind] ?? ''),
      },
    });
  };

  if (status === 'turnComplete') {
    const correct = turnEvents.filter((e) => e.kind === 'correct').length;
    return (
      <div className="play-stack">
        <TurnHeader session={session} game={game} />
        <TurnCompletePanel session={session} game={game} dispatch={dispatch} drawNext={drawNext} heading={`${correct} correct answer${correct === 1 ? '' : 's'} in ${formatDuration(session.settings.turnSeconds)}`} tone={correct > 0 ? 'success' : 'neutral'}>
          <TurnTally events={turnEvents} />
          {turnEvents.length > 0 && (
            <ol className="turn-results">
              {turnEvents.map((e) => (
                <li key={e.id}>
                  <span className={`tag ${e.kind === 'correct' ? 'tag-accent' : ''}`}>{RESULT_LABEL[e.kind] ?? e.kind}</span>
                  <span className="turn-result-text">{e.contentTitle}</span>
                  <span className="turn-result-pts">{formatPoints(e.points)}</span>
                </li>
              ))}
            </ol>
          )}
        </TurnCompletePanel>
      </div>
    );
  }

  return (
    <div className="play-stack">
      <TurnHeader session={session} game={game} />
      <div className="play-grid">
        <ChallengeCard label={game.contentLabel} content={status === 'ready' ? (challenge ? { ...challenge, title: 'Get ready…' } : null) : challenge} generator={generator} canGenerate={status === 'ready' || status === 'paused'}>
          {challenge &&
            (status === 'ready' ? (
              <div className="hidden-content">
                <p className="challenge-text">
                  {player?.name ?? participant.name}, you have {formatDuration(session.settings.turnSeconds)} to answer as many challenges as you can.
                </p>
                <p className="muted">Challenges appear when the host starts the clock. Say "Pass" to skip.</p>
              </div>
            ) : (
              <div>
                <div className="chip-row">
                  <span className="chip chip-outline">{challenge.category}</span>
                  <span className="chip">{challenge.kind === 'task' ? 'Creative task' : 'Question'}</span>
                  <span className="chip">{reward} pt{reward === 1 ? '' : 's'}</span>
                </div>
                <p className="challenge-text is-large">{challenge.prompt}</p>
                <div className="reveal-row">
                  {challenge.hint &&
                    (reveal.hint ? (
                      <div className="hint-box">
                        <Lightbulb size={16} aria-hidden="true" />
                        <p>
                          <strong>Hint:</strong> {challenge.hint}
                        </p>
                      </div>
                    ) : (
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'reveal', patch: { hint: true } })}>
                        <Lightbulb size={15} aria-hidden="true" /> Hint (−{hintPenalty})
                      </button>
                    ))}
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'reveal', patch: { answer: !reveal.answer } })} aria-expanded={reveal.answer}>
                    {reveal.answer ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />} {reveal.answer ? 'Hide answer' : 'Show answer (host)'}
                  </button>
                </div>
                {reveal.answer && (
                  <div className="answer-box">
                    <p className="host-note-label">{challenge.kind === 'task' ? 'A good response' : 'Answer'}</p>
                    <p className="answer-text">{challenge.answer}</p>
                  </div>
                )}
              </div>
            ))}
        </ChallengeCard>

        <aside className="play-side">
          <GameTimer remainingMs={remainingMs} durationMs={session.timer.durationMs} status={status} label="Turn clock" />
          {inTurn && <TurnTally events={turnEvents} />}
          {status === 'ready' ? (
            <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => dispatch({ type: 'startTurn', now: Date.now() })} disabled={!challenge}>
              <Play size={18} aria-hidden="true" /> Start {formatDuration(session.settings.turnSeconds)}
            </button>
          ) : (
            inTurn && (
              <div className="decision-stack">
                <p className="field-label">{status === 'timeUp' ? 'Was the last answer in time?' : 'Host decision'}</p>
                <button type="button" className="btn btn-success btn-lg btn-block" onClick={() => record('correct')} disabled={!challenge || status === 'paused'}>
                  <CircleCheck size={18} aria-hidden="true" /> Correct +{reward}
                </button>
                {status === 'timeUp' ? (
                  <button type="button" className="btn btn-secondary btn-block" onClick={() => record('timeout')} disabled={!challenge}>
                    <CircleX size={17} aria-hidden="true" /> Not in time
                  </button>
                ) : (
                  <>
                    <button type="button" className="btn btn-secondary btn-block" onClick={() => record('incorrect')} disabled={!challenge || status === 'paused'}>
                      <CircleX size={17} aria-hidden="true" /> Incorrect
                    </button>
                    <button type="button" className="btn btn-secondary btn-block" onClick={() => record('skip')} disabled={!challenge || status === 'paused'}>
                      <SkipForward size={16} aria-hidden="true" /> Pass
                    </button>
                  </>
                )}
                <PauseResumeButton session={session} dispatch={dispatch} />
                {status !== 'timeUp' && (
                  <button type="button" className="btn btn-ghost btn-block" onClick={() => dispatch({ type: 'endTurn', now: Date.now() })}>
                    <Square size={15} aria-hidden="true" /> End Turn Early
                  </button>
                )}
                {status === 'timeUp' && !challenge && (
                  <button type="button" className="btn btn-primary btn-block" onClick={() => dispatch({ type: 'endTurn', now: Date.now() })}>
                    End Turn
                  </button>
                )}
              </div>
            )
          )}
        </aside>
      </div>
      {status === 'timeUp' && <TimeUpBanner>Did {player?.name ?? participant.name} answer the last challenge before the buzzer? Record it to finish the turn.</TimeUpBanner>}
    </div>
  );
}
