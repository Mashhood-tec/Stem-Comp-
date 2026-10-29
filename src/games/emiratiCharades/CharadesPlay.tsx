import { CircleCheck, CircleX, Eye, EyeOff, MessageSquareOff, Play, SkipForward, Square, VenetianMask } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ChallengeCard, OriginBadge } from '../../components/ChallengeCard';
import { GameTimer } from '../../components/GameTimer';
import { Modal } from '../../components/Modal';
import { PauseResumeButton, RoundCompletePanel, TimeUpBanner, TurnCompletePanel, TurnHeader } from '../../components/session/SessionParts';
import { currentParticipant, currentPlayer, currentTurnEvents } from '../../engine/session';
import type { CharadePrompt } from '../../types/content';
import type { EventKind } from '../../types/session';
import { SCORING } from '../../utils/scoring';
import type { PlayProps } from '../types';

export function PerformerView({ open, prompt, performer, onClose }: { open: boolean; prompt: CharadePrompt | null; performer: string; onClose: () => void }) {
  return (
    <Modal open={open && prompt !== null} onClose={onClose} labelledBy="performer-title" className="performer-view">
      {prompt && (
        <>
          <p className="eyebrow">
            <VenetianMask size={14} aria-hidden="true" /> For {performer}'s eyes only
          </p>
          <OriginBadge origin={prompt.origin} />
          <p className="performer-category">{prompt.category}</p>
          <h2 id="performer-title" className="performer-prompt">
            {prompt.prompt}
          </h2>
          <p className="performer-tip">
            <strong>Acting tip:</strong> {prompt.actingTip}
          </p>
          <p className="muted small">No talking, no spelling, no pointing at the real object. Worth {prompt.points} point{prompt.points === 1 ? '' : 's'}.</p>
          <button type="button" className="btn btn-primary btn-lg btn-block" onClick={onClose} data-autofocus>
            <EyeOff size={18} aria-hidden="true" /> Got it — Hide Prompt
          </button>
        </>
      )}
    </Modal>
  );
}

export function CharadesPlay(props: PlayProps) {
  const { session, game, dispatch, remainingMs, drawNext, generator } = props;
  const prompt = session.content as CharadePrompt | null;
  const participant = currentParticipant(session);
  const performer = currentPlayer(session, participant);
  const performerName = performer?.name ?? participant.name;
  const { status, reveal } = session;
  const inTurn = status === 'playing' || status === 'paused' || status === 'timeUp';
  const [performerOpen, setPerformerOpen] = useState(false);
  const [peek, setPeek] = useState(false);
  const { maxSkipsPerTurn, saidAnswerPenalty } = SCORING.emiratiCharades;
  const skipsUsed = currentTurnEvents(session).filter((e) => e.kind === 'skip').length;
  const guessers = session.mode === 'team' ? `${participant.name} guesses` : 'everyone else guesses';

  useEffect(() => setPeek(false), [prompt?.id, status]);

  if (status === 'roundComplete') return <RoundCompletePanel session={session} game={game} dispatch={dispatch} drawNext={drawNext} />;

  const closePerformer = () => {
    setPerformerOpen(false);
    if (!reveal.prompt) dispatch({ type: 'reveal', patch: { prompt: true } });
  };

  const record = (kind: EventKind, points: number, note: string, endTurn: boolean, nextContent?: CharadePrompt | null) => {
    if (!prompt) return;
    dispatch({
      type: 'record',
      now: Date.now(),
      endTurn,
      nextContent,
      event: { participantId: participant.id, playerId: performer?.id ?? null, kind, points, contentId: prompt.id, contentTitle: prompt.title, note },
    });
  };

  const skip = () => {
    if (skipsUsed >= maxSkipsPerTurn) return;
    const next = drawNext() as CharadePrompt | null;
    record('skip', 0, 'Prompt skipped — no points', false, next);
    if (next) setPerformerOpen(true);
  };

  if (status === 'turnComplete') {
    const result = currentTurnEvents(session).filter((e) => e.kind !== 'skip').pop();
    const heading =
      result?.kind === 'correct' ? `Guessed it! Great acting, ${performerName}.` : result?.kind === 'penalty' ? 'Oops — the answer was said aloud.' : 'Not guessed this time.';
    return (
      <div className="play-stack">
        <TurnHeader session={session} game={game} role={`performer · ${guessers}`} />
        <TurnCompletePanel session={session} game={game} dispatch={dispatch} drawNext={drawNext} heading={heading} tone={result?.kind === 'correct' ? 'success' : result?.kind === 'penalty' ? 'danger' : 'neutral'}>
          {prompt && (
            <div className="answer-box">
              <p className="host-note-label">The prompt was</p>
              <p className="answer-text">{prompt.prompt}</p>
            </div>
          )}
          {skipsUsed > 0 && <p className="muted small">{skipsUsed} prompt{skipsUsed === 1 ? '' : 's'} skipped this turn (no points).</p>}
        </TurnCompletePanel>
      </div>
    );
  }

  const promptVisible = peek && inTurn;

  return (
    <div className="play-stack">
      <TurnHeader session={session} game={game} role={`performer · ${guessers}`} />
      <div className="play-grid">
        <ChallengeCard
          label={game.contentLabel}
          content={prompt}
          generator={generator}
          canGenerate={status === 'ready'}
          title={promptVisible ? prompt?.title : `${prompt?.category ?? 'Secret'} prompt`}
        >
          {prompt && (
            <div className="charade">
              <div className={`secret-box ${promptVisible ? 'is-visible' : ''}`} aria-live="polite">
                {promptVisible ? (
                  <>
                    <p className="chip chip-outline">{prompt.category}</p>
                    <p className="secret-prompt">{prompt.prompt}</p>
                    <p className="small muted">{prompt.actingTip}</p>
                  </>
                ) : (
                  <>
                    <EyeOff size={28} strokeWidth={1.5} aria-hidden="true" />
                    <p className="secret-label">Prompt hidden</p>
                    <p className="muted small">
                      {reveal.prompt ? `${performerName} has seen the prompt.` : `Only ${performerName} should see it. Tap "Show Prompt to Performer".`}
                    </p>
                  </>
                )}
              </div>
              <div className="btn-row">
                <button type="button" className="btn btn-secondary" onClick={() => setPerformerOpen(true)}>
                  <VenetianMask size={16} aria-hidden="true" /> Show Prompt to Performer
                </button>
                {inTurn && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPeek((p) => !p)} aria-pressed={peek}>
                    {peek ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />} {peek ? 'Hide Prompt' : 'Reveal Prompt (host)'}
                  </button>
                )}
              </div>
            </div>
          )}
        </ChallengeCard>

        <aside className="play-side">
          <GameTimer remainingMs={remainingMs} durationMs={session.timer.durationMs} status={status} label="Acting time" />
          {status === 'ready' ? (
            <>
              <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => dispatch({ type: 'startTurn', now: Date.now() })} disabled={!prompt}>
                <Play size={18} aria-hidden="true" /> {reveal.prompt ? 'Ready to Act — Start Timer' : 'Start Acting'}
              </button>
              {!reveal.prompt && <p className="muted small center">Tip: let {performerName} view the prompt first.</p>}
            </>
          ) : (
            inTurn && (
              <div className="decision-stack">
                <p className="field-label">Host decision</p>
                <button type="button" className="btn btn-success btn-lg btn-block" onClick={() => record('correct', prompt?.points ?? 0, 'Guessed correctly', true)} disabled={!prompt}>
                  <CircleCheck size={18} aria-hidden="true" /> Correct +{prompt?.points ?? 0}
                </button>
                <button type="button" className="btn btn-secondary btn-block" onClick={() => record('incorrect', 0, 'Not guessed', true)} disabled={!prompt}>
                  <CircleX size={17} aria-hidden="true" /> {status === 'timeUp' ? 'Not Guessed' : 'Mark Incorrect'}
                </button>
                {status !== 'timeUp' && (
                  <button type="button" className="btn btn-secondary btn-block" onClick={skip} disabled={!prompt || skipsUsed >= maxSkipsPerTurn}>
                    <SkipForward size={16} aria-hidden="true" /> Skip Prompt ({maxSkipsPerTurn - skipsUsed} left)
                  </button>
                )}
                <button type="button" className="btn btn-danger-ghost btn-block" onClick={() => record('penalty', saidAnswerPenalty, 'Said the answer aloud', true)} disabled={!prompt}>
                  <MessageSquareOff size={16} aria-hidden="true" /> Said it aloud ({saidAnswerPenalty})
                </button>
                <PauseResumeButton session={session} dispatch={dispatch} />
                <button type="button" className="btn btn-ghost btn-block" onClick={() => record('timeout', 0, 'Turn ended by host', true)} disabled={!prompt}>
                  <Square size={15} aria-hidden="true" /> End Turn
                </button>
              </div>
            )
          )}
        </aside>
      </div>
      {status === 'timeUp' && <TimeUpBanner>Did {session.mode === 'team' ? participant.name : 'anyone'} guess the prompt before the buzzer?</TimeUpBanner>}
      <PerformerView open={performerOpen} prompt={prompt} performer={performerName} onClose={closePerformer} />
    </div>
  );
}
