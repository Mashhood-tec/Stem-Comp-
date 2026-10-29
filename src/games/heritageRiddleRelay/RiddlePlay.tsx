import { CircleCheck, CircleX, Eye, Lightbulb, Play } from 'lucide-react';
import { ChallengeCard } from '../../components/ChallengeCard';
import { GameTimer } from '../../components/GameTimer';
import { PauseResumeButton, RoundCompletePanel, TimeUpBanner, TurnCompletePanel, TurnHeader } from '../../components/session/SessionParts';
import { currentParticipant, currentPlayer, currentTurnEvents } from '../../engine/session';
import type { HeritageRiddle } from '../../types/content';
import { SCORING, pointsAfterHint } from '../../utils/scoring';
import type { PlayProps } from '../types';

export function RiddlePlay(props: PlayProps) {
  const { session, game, dispatch, remainingMs, drawNext, generator } = props;
  const riddle = session.content as HeritageRiddle | null;
  const participant = currentParticipant(session);
  const player = currentPlayer(session, participant);
  const { status, reveal } = session;
  const { hintPenalty, minPoints } = SCORING.heritageRiddleRelay;
  const reward = riddle ? pointsAfterHint(riddle.points, reveal.hint, hintPenalty, minPoints) : 0;
  const inTurn = status === 'playing' || status === 'paused' || status === 'timeUp';

  if (status === 'roundComplete') return <RoundCompletePanel session={session} game={game} dispatch={dispatch} drawNext={drawNext} />;

  const record = (kind: 'correct' | 'incorrect' | 'timeout') => {
    if (!riddle) return;
    dispatch({
      type: 'record',
      now: Date.now(),
      endTurn: true,
      event: {
        participantId: participant.id,
        playerId: player?.id ?? null,
        kind,
        points: kind === 'correct' ? reward : 0,
        contentId: riddle.id,
        contentTitle: riddle.title,
        note: kind === 'correct' ? (reveal.hint ? 'Solved with the hint' : 'Solved without a hint') : kind === 'timeout' ? 'No answer in time' : 'Answer not accepted',
      },
    });
  };

  if (status === 'turnComplete') {
    const result = currentTurnEvents(session).find((e) => e.kind === 'correct' || e.kind === 'incorrect' || e.kind === 'timeout');
    const correct = result?.kind === 'correct';
    return (
      <div className="play-stack">
        <TurnHeader session={session} game={game} role="relay runner" />
        <TurnCompletePanel session={session} game={game} dispatch={dispatch} drawNext={drawNext} heading={correct ? `Correct! Well solved, ${participant.name}.` : 'Not this time.'} tone={correct ? 'success' : 'neutral'}>
          {riddle && (
            <div className="answer-box">
              <p className="host-note-label">Answer</p>
              <p className="answer-text">{riddle.answer}</p>
              <p>{riddle.explanation}</p>
            </div>
          )}
        </TurnCompletePanel>
      </div>
    );
  }

  return (
    <div className="play-stack">
      <TurnHeader session={session} game={game} role="relay runner reads the riddle aloud" />

      <div className="play-grid">
        <ChallengeCard label={game.contentLabel} content={riddle} generator={generator} canGenerate={status === 'ready'}>
          {riddle &&
            (status === 'ready' ? (
              <div className="hidden-content">
                <p className="chip chip-outline">{riddle.topic}</p>
                <p className="muted">The riddle appears when the host starts the turn. Worth {riddle.points} points.</p>
              </div>
            ) : (
              <div>
                <p className="chip chip-outline">{riddle.topic}</p>
                <p className="challenge-text">{riddle.riddle}</p>
                <div className="reveal-row">
                  {reveal.hint ? (
                    <div className="hint-box" aria-live="polite">
                      <Lightbulb size={16} aria-hidden="true" />
                      <p>
                        <strong>Hint:</strong> {riddle.hint}
                      </p>
                    </div>
                  ) : (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'reveal', patch: { hint: true } })}>
                      <Lightbulb size={15} aria-hidden="true" /> Reveal Hint (−{hintPenalty} point)
                    </button>
                  )}
                  {reveal.answer ? (
                    <div className="answer-box" aria-live="polite">
                      <p className="host-note-label">Answer</p>
                      <p className="answer-text">{riddle.answer}</p>
                      <p className="small">{riddle.explanation}</p>
                    </div>
                  ) : (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'reveal', patch: { answer: true } })}>
                      <Eye size={15} aria-hidden="true" /> Reveal Answer
                    </button>
                  )}
                </div>
              </div>
            ))}
        </ChallengeCard>

        <aside className="play-side">
          <GameTimer remainingMs={remainingMs} durationMs={session.timer.durationMs} status={status} label="Answer time" />
          {status === 'ready' ? (
            <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => dispatch({ type: 'startTurn', now: Date.now() })} disabled={!riddle}>
              <Play size={18} aria-hidden="true" /> Start Turn
            </button>
          ) : (
            inTurn && (
              <div className="decision-stack">
                <p className="field-label">Host decision</p>
                <button type="button" className="btn btn-success btn-lg btn-block" onClick={() => record('correct')} disabled={!riddle}>
                  <CircleCheck size={18} aria-hidden="true" /> Correct +{reward}
                </button>
                <button type="button" className="btn btn-secondary btn-block" onClick={() => record('incorrect')} disabled={!riddle}>
                  <CircleX size={17} aria-hidden="true" /> Incorrect
                </button>
                {status === 'timeUp' && (
                  <button type="button" className="btn btn-ghost btn-block" onClick={() => record('timeout')} disabled={!riddle}>
                    No answer given
                  </button>
                )}
                <PauseResumeButton session={session} dispatch={dispatch} />
              </div>
            )
          )}
        </aside>
      </div>

      {status === 'timeUp' && <TimeUpBanner>Did the team give their final answer in time? Record the result to pass the baton.</TimeUpBanner>}
    </div>
  );
}
