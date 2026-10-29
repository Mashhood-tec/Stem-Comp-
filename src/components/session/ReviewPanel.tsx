import { Check, CircleCheck, Crown, Eye, EyeOff, Scale, Shuffle, X } from 'lucide-react';
import { useState } from 'react';
import type { SessionAction } from '../../engine/session';
import type { GameContent } from '../../types/content';
import type { GameDefinition } from '../../types/game';
import type { GameSession } from '../../types/session';
import { activeEvents, computeStandings, describeDecidedBy, determineOutcome, rankStandings } from '../../utils/scoring';
import { ChallengeCard } from '../ChallengeCard';
import { useConfirm } from '../ConfirmationDialog';

interface ReviewProps {
  session: GameSession;
  game: GameDefinition;
  dispatch: (a: SessionAction) => void;
  onConfirm: (acceptTie: boolean) => void;
  drawTiebreak: () => GameContent | null;
}

export function ReviewPanel({ session, game, dispatch, onConfirm, drawTiebreak }: ReviewProps) {
  const confirm = useConfirm();
  const standings = computeStandings(session.participants, session.events);
  const ranked = rankStandings(standings);
  const outcome = determineOutcome(session.gameId, standings);
  const isFootball = session.gameId === 'football';
  const unit = isFootball ? 'goals' : 'points';
  const nameOf = (id: string) => session.participants.find((p) => p.id === id)?.name ?? '';

  if (session.status === 'tiebreak' && session.tiebreak) {
    return session.tiebreak.kind === 'shootout' ? (
      <Shootout session={session} dispatch={dispatch} />
    ) : (
      <TiebreakChallenge session={session} game={game} dispatch={dispatch} drawTiebreak={drawTiebreak} />
    );
  }

  const acceptTie = async () => {
    const ok = await confirm({
      title: 'Record this game as a tie?',
      message: `${outcome.type === 'tie' ? outcome.participantIds.map(nameOf).join(' and ') : ''} will share the result. No winner will be declared.`,
      confirmLabel: 'Record tie',
    });
    if (ok) onConfirm(true);
  };

  const startTiebreak = () => {
    if (outcome.type !== 'tie') return;
    dispatch({ type: 'startTiebreak', kind: isFootball ? 'shootout' : 'challenge', participantIds: outcome.participantIds, content: isFootball ? null : drawTiebreak() });
  };

  const two = ranked.length === 2 ? session.participants.map((p) => standings.find((s) => s.participantId === p.id)!) : null;

  return (
    <section className="result-panel review-panel" aria-labelledby="review-title">
      <p className="eyebrow">Step 5 · Host confirms the result</p>
      <h2 id="review-title" className="result-title">
        Confirm the final result
      </h2>
      <p className="muted">Check every score is correct. You can still undo any entry in the score history before confirming.</p>

      {two ? (
        <div className="final-score" aria-label={`${two[0].name} ${two[0].score}, ${two[1].name} ${two[1].score}`}>
          <span className="final-name">{two[0].name}</span>
          <span className="final-digits">
            {two[0].score}
            <span className="final-sep">–</span>
            {two[1].score}
          </span>
          <span className="final-name">{two[1].name}</span>
        </div>
      ) : (
        <ol className="rank-list">
          {ranked.map((s, i) => (
            <li key={s.participantId}>
              <span className="rank-pos">{i + 1}</span>
              <span className="rank-name">{s.name}</span>
              <span className="rank-score">
                {s.score} {unit}
              </span>
            </li>
          ))}
        </ol>
      )}

      {outcome.type === 'win' ? (
        <div className="outcome-box is-win">
          <Crown size={22} aria-hidden="true" />
          <div>
            <p className="outcome-title">{outcome.winnerIds.map(nameOf).join(' & ')} wins</p>
            <p className="muted small">{describeDecidedBy(outcome)}</p>
          </div>
        </div>
      ) : (
        <div className="outcome-box is-tie">
          <Scale size={22} aria-hidden="true" />
          <div>
            <p className="outcome-title">It's level: {outcome.participantIds.map(nameOf).join(' and ')}</p>
            <p className="muted small">{game.rules.tieBreak}</p>
          </div>
        </div>
      )}

      <div className="btn-row">
        {outcome.type === 'win' ? (
          <button type="button" className="btn btn-primary btn-lg" onClick={() => onConfirm(false)} data-autofocus>
            <CircleCheck size={18} aria-hidden="true" /> Confirm Result
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-primary btn-lg" onClick={startTiebreak}>
              {isFootball ? (activeEvents(session.events).some((e) => e.kind === 'shootout') ? 'Continue Penalty Shootout' : 'Start Penalty Shootout') : 'Play Sudden-Death Tie-Break'}
            </button>
            <button type="button" className="btn btn-ghost btn-lg" onClick={() => void acceptTie()}>
              Record as a Tie
            </button>
          </>
        )}
      </div>
    </section>
  );
}

function TiebreakChallenge({ session, game, dispatch, drawTiebreak }: Omit<ReviewProps, 'onConfirm'>) {
  const tiebreak = session.tiebreak!;
  const content = tiebreak.content;
  const [showAnswer, setShowAnswer] = useState(false);
  const contenders = session.participants.filter((p) => tiebreak.participantIds.includes(p.id));

  const award = (participantId: string) =>
    dispatch({
      type: 'record',
      now: Date.now(),
      event: { participantId, kind: 'tiebreak', points: 0, contentId: content?.id, contentTitle: content?.title, note: 'Tie-break awarded by host' },
    });

  return (
    <section className="play-stack" aria-labelledby="tiebreak-title">
      <div className="turn-header">
        <div>
          <p className="eyebrow">Sudden-death tie-break</p>
          <h2 id="tiebreak-title" className="turn-name">
            {contenders.map((c) => c.name).join(' vs ')}
          </h2>
          <p className="turn-sub">{game.rules.tieBreak}</p>
        </div>
      </div>
      <ChallengeCard
        label={`Tie-break ${game.contentLabel.toLowerCase()}`}
        content={content}
        title={content?.gameId === 'emiratiCharades' && !showAnswer ? `${content.category} prompt` : undefined}
        actions={
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'setTiebreakContent', content: drawTiebreak() })}>
            <Shuffle size={15} aria-hidden="true" /> Different challenge
          </button>
        }
      >
        {content && <TiebreakBody content={content} showAnswer={showAnswer} />}
        {content && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAnswer((v) => !v)} aria-pressed={showAnswer}>
            {showAnswer ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />} {showAnswer ? 'Hide' : 'Reveal'} {content.gameId === 'emiratiCharades' ? 'prompt' : 'answer / guidance'}
          </button>
        )}
      </ChallengeCard>
      <div className="decision-row">
        <p className="field-label">Who wins the tie-break?</p>
        <div className="btn-row">
          {contenders.map((c) => (
            <button key={c.id} type="button" className="btn btn-success" onClick={() => award(c.id)}>
              <Crown size={16} aria-hidden="true" /> {c.name} wins
            </button>
          ))}
          <button type="button" className="btn btn-ghost" onClick={() => dispatch({ type: 'closeTiebreak' })}>
            Cancel tie-break
          </button>
        </div>
      </div>
    </section>
  );
}

function TiebreakBody({ content, showAnswer }: { content: GameContent; showAnswer: boolean }) {
  switch (content.gameId) {
    case 'heritageRiddleRelay':
      return (
        <>
          <p className="challenge-text">{content.riddle}</p>
          {showAnswer && <p className="answer-box answer-text">{content.answer}</p>}
        </>
      );
    case 'desertExpedition':
      return (
        <>
          <p className="story-text">{content.scenario}</p>
          <p className="challenge-text">{content.challenge}</p>
          <ul className="rules-list">
            {content.choices.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          {showAnswer && <p className="host-note-box">{content.hostGuidance}</p>}
        </>
      );
    case 'emiratiCharades':
      return showAnswer ? (
        <p className="secret-prompt">{content.prompt}</p>
      ) : (
        <p className="muted">Prompt hidden. Show it only to the performers, then each tied side acts it in turn.</p>
      );
    case 'cultureSportsChallenge':
      return (
        <>
          <p className="challenge-text is-large">{content.prompt}</p>
          {showAnswer && <p className="answer-box answer-text">{content.answer}</p>}
        </>
      );
    default:
      return null;
  }
}

function Shootout({ session, dispatch }: Pick<ReviewProps, 'session' | 'dispatch'>) {
  const teams = session.participants.filter((p) => session.tiebreak!.participantIds.includes(p.id));
  const kicks = activeEvents(session.events).filter((e) => e.kind === 'shootout');
  const tally = (id: string) => kicks.filter((k) => k.participantId === id && k.scored).length;
  const taken = (id: string) => kicks.filter((k) => k.participantId === id).length;
  const level = teams.length === 2 && tally(teams[0].id) === tally(teams[1].id);

  const kick = (teamId: string, scored: boolean) =>
    dispatch({
      type: 'record',
      now: Date.now(),
      event: { participantId: teamId, kind: 'shootout', points: 0, scored, note: scored ? 'Penalty scored' : 'Penalty missed' },
    });

  return (
    <section className="play-stack" aria-labelledby="shootout-title">
      <div className="turn-header">
        <div>
          <p className="eyebrow">Tie-break</p>
          <h2 id="shootout-title" className="turn-name">
            Penalty shootout
          </h2>
          <p className="turn-sub">Three kicks each, taken in turns. If still level, continue one kick each (sudden death). The host records every kick.</p>
        </div>
      </div>
      <div className="shootout-grid">
        {teams.map((team) => (
          <div key={team.id} className="panel shootout-team">
            <p className="match-team-name">{team.name}</p>
            <p className="match-score" aria-live="polite">
              {tally(team.id)}
            </p>
            <ol className="kick-list" aria-label={`${team.name} kicks`}>
              {kicks
                .filter((k) => k.participantId === team.id)
                .map((k, i) => (
                  <li key={k.id} className={k.scored ? 'is-scored' : 'is-missed'} aria-label={`Kick ${i + 1}: ${k.scored ? 'scored' : 'missed'}`}>
                    {k.scored ? <Check size={14} /> : <X size={14} />}
                  </li>
                ))}
            </ol>
            <p className="muted small">{taken(team.id)} kick{taken(team.id) === 1 ? '' : 's'} taken</p>
            <div className="btn-row">
              <button type="button" className="btn btn-success btn-sm" onClick={() => kick(team.id, true)}>
                <Check size={15} aria-hidden="true" /> Scored
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => kick(team.id, false)}>
                <X size={15} aria-hidden="true" /> Missed
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="btn-row">
        <button type="button" className="btn btn-primary btn-lg" onClick={() => dispatch({ type: 'closeTiebreak' })} disabled={level}>
          Finish Shootout
        </button>
        {level && <p className="muted small">The shootout can finish once one team is ahead.</p>}
      </div>
    </section>
  );
}
