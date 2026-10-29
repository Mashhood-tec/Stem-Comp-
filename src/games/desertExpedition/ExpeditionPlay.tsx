import { Compass, Eye, EyeOff, Play, Plus, Star } from 'lucide-react';
import { ChallengeCard } from '../../components/ChallengeCard';
import { GameTimer } from '../../components/GameTimer';
import { PauseResumeButton, RoundCompletePanel, TimeUpBanner, TurnCompletePanel, TurnHeader } from '../../components/session/SessionParts';
import { currentParticipant, currentPlayer, currentTurnEvents } from '../../engine/session';
import type { ExpeditionScenario } from '../../types/content';
import { SCORING } from '../../utils/scoring';
import type { PlayProps } from '../types';

const LETTERS = ['A', 'B', 'C', 'D'];

export function ExpeditionPlay(props: PlayProps) {
  const { session, game, dispatch, remainingMs, drawNext, generator } = props;
  const scenario = session.content as ExpeditionScenario | null;
  const participant = currentParticipant(session);
  const player = currentPlayer(session, participant);
  const { status, reveal } = session;
  const inTurn = status === 'playing' || status === 'paused' || status === 'timeUp';
  const { levels, followUpBonus } = SCORING.desertExpedition;

  if (status === 'roundComplete') return <RoundCompletePanel session={session} game={game} dispatch={dispatch} drawNext={drawNext} />;

  const award = (levelId: string) => {
    const level = levels.find((l) => l.id === levelId);
    if (!scenario || !level) return;
    const choice = reveal.choice !== null ? `Chose ${LETTERS[reveal.choice]}` : 'Open answer';
    dispatch({
      type: 'record',
      now: Date.now(),
      endTurn: true,
      event: {
        participantId: participant.id,
        playerId: player?.id ?? null,
        kind: level.points > 0 ? 'correct' : 'incorrect',
        points: level.points,
        contentId: scenario.id,
        contentTitle: scenario.title,
        note: `${choice} · ${level.label}`,
      },
    });
  };

  if (status === 'turnComplete') {
    const events = currentTurnEvents(session);
    const main = events.find((e) => e.contentId === scenario?.id);
    const followUpId = scenario ? `${scenario.id}:follow-up` : '';
    const bonusDone = events.some((e) => e.kind === 'bonus' && e.contentId === followUpId);
    return (
      <div className="play-stack">
        <TurnHeader session={session} game={game} role="expedition leader" />
        <TurnCompletePanel
          session={session}
          game={game}
          dispatch={dispatch}
          drawNext={drawNext}
          heading={main ? `${main.note.split(' · ')[1] ?? 'Decision recorded'}` : 'Decision recorded'}
          tone={main && main.points >= 2 ? 'success' : 'neutral'}
        >
          {scenario?.followUp && (
            <div className="followup-box">
              <p className="host-note-label">
                <Star size={14} aria-hidden="true" /> Optional follow-up challenge
              </p>
              <p className="followup-text">{scenario.followUp}</p>
              {bonusDone ? (
                <p className="tag tag-accent">Bonus +{followUpBonus} awarded</p>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() =>
                    dispatch({
                      type: 'record',
                      now: Date.now(),
                      event: { participantId: participant.id, playerId: player?.id ?? null, kind: 'bonus', points: followUpBonus, contentId: followUpId, contentTitle: scenario.title, note: 'Follow-up completed' },
                    })
                  }
                >
                  <Plus size={15} aria-hidden="true" /> Completed · award +{followUpBonus}
                </button>
              )}
            </div>
          )}
        </TurnCompletePanel>
      </div>
    );
  }

  return (
    <div className="play-stack">
      <TurnHeader session={session} game={game} role="expedition leader" />
      <div className="play-grid">
        <ChallengeCard label={game.contentLabel} content={scenario} generator={generator} canGenerate={status === 'ready'}>
          {scenario && (
            <div className="scenario">
              <p className="story-text">{scenario.scenario}</p>
              <p className="challenge-text">
                <Compass size={18} aria-hidden="true" /> {scenario.challenge}
              </p>
              <div className="choice-list" role="radiogroup" aria-label="Team's choice (selected by the host)">
                {scenario.choices.map((choice, i) => {
                  const selected = reveal.choice === i;
                  const suggested = reveal.guidance && scenario.suggestedChoice === i;
                  return (
                    <button
                      key={choice}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      className={`choice ${selected ? 'is-selected' : ''} ${suggested ? 'is-suggested' : ''}`}
                      onClick={() => inTurn && dispatch({ type: 'reveal', patch: { choice: selected ? null : i } })}
                      disabled={!inTurn}
                    >
                      <span className="choice-letter">{LETTERS[i]}</span>
                      <span className="choice-text">{choice}</span>
                      {selected && <span className="tag tag-accent">Team's choice</span>}
                      {suggested && <span className="tag">Suggested</span>}
                    </button>
                  );
                })}
              </div>
              {inTurn && (
                <>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'reveal', patch: { guidance: !reveal.guidance } })} aria-expanded={reveal.guidance}>
                    {reveal.guidance ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
                    {reveal.guidance ? 'Hide host guidance' : 'Reveal host guidance'}
                  </button>
                  {reveal.guidance && (
                    <div className="host-note-box">
                      <p className="host-note-label">Host guidance</p>
                      <p>{scenario.hostGuidance}</p>
                      <p className="host-note-label">Listen for</p>
                      <ul className="rules-list">
                        {scenario.scoringCriteria.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
              {status === 'ready' && <p className="muted small">Read the story aloud, then start the discussion timer. The host selects the team's choice once they decide.</p>}
            </div>
          )}
        </ChallengeCard>

        <aside className="play-side">
          <GameTimer remainingMs={remainingMs} durationMs={session.timer.durationMs} status={status} label="Discussion time" />
          {status === 'ready' ? (
            <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => dispatch({ type: 'startTurn', now: Date.now() })} disabled={!scenario}>
              <Play size={18} aria-hidden="true" /> Start Discussion
            </button>
          ) : (
            inTurn && (
              <div className="decision-stack">
                <p className="field-label">Award points for the explanation</p>
                {levels.map((level) => (
                  <button key={level.id} type="button" className={`btn ${level.points === 3 ? 'btn-success' : 'btn-secondary'} btn-block level-btn`} onClick={() => award(level.id)} disabled={!scenario}>
                    <span>{level.label}</span>
                    <strong>+{level.points}</strong>
                  </button>
                ))}
                <PauseResumeButton session={session} dispatch={dispatch} />
              </div>
            )
          )}
        </aside>
      </div>
      {status === 'timeUp' && <TimeUpBanner>Discussion time is over. Ask the team for its final decision and explanation, then award points.</TimeUpBanner>}
    </div>
  );
}
