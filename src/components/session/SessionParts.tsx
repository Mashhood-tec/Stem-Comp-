import { AlarmClock, ArrowRight, Flag, LogOut, Pause, Play, Undo2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { currentParticipant, currentPlayer, currentTurnEvents, isFinalTurn, upNext, type SessionAction } from '../../engine/session';
import type { GameContent } from '../../types/content';
import type { GameDefinition } from '../../types/game';
import type { GameSession, SessionStatus } from '../../types/session';
import { computeRoundScores, computeStandings } from '../../utils/scoring';
import { useConfirm } from '../ConfirmationDialog';
import { formatPoints } from '../EventLog';
import { GameIconTile } from '../GameCard';
import { RoundIndicator } from '../RoundIndicator';

export const STATUS_LABEL: Record<SessionStatus, string> = {
  ready: 'Ready',
  playing: 'In play',
  paused: 'Paused',
  timeUp: "Time's up",
  turnComplete: 'Turn complete',
  roundComplete: 'Round complete',
  review: 'Confirm result',
  tiebreak: 'Tie-break',
  finished: 'Finished',
};

/* ---------- Top bar ---------- */

export function SessionTopBar({ session, game, onEnd, onExit }: { session: GameSession; game: GameDefinition; onEnd: () => void; onExit: () => void }) {
  const canEnd = session.startedAt !== null && !['review', 'tiebreak', 'finished'].includes(session.status);
  return (
    <div className="session-topbar">
      <div className="session-topbar-main">
        <GameIconTile game={game} size="sm" />
        <div className="session-topbar-text">
          <h1 className="session-title">{game.name}</h1>
          <div className="session-topbar-meta">
            <span className={`status-pill status-${session.status}`}>
              <span className="status-dot" aria-hidden="true" />
              {STATUS_LABEL[session.status]}
            </span>
            <span className="muted small">
              {game.roundLabel} {Math.min(session.round, session.settings.totalRounds)} of {session.settings.totalRounds}
            </span>
          </div>
        </div>
      </div>
      <div className="btn-row tight">
        {canEnd && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onEnd}>
            <Flag size={15} aria-hidden="true" /> End Game
          </button>
        )}
        <button type="button" className="btn btn-ghost btn-sm" onClick={onExit}>
          <LogOut size={15} aria-hidden="true" /> Exit
        </button>
      </div>
    </div>
  );
}

/* ---------- Turn header ---------- */

export function TurnHeader({ session, game, role }: { session: GameSession; game: GameDefinition; role?: string }) {
  const participant = currentParticipant(session);
  const player = currentPlayer(session, participant);
  const next = upNext(session);
  const teamMode = session.mode === 'team';
  return (
    <div className="turn-header">
      <div>
        <p className="eyebrow">Now playing</p>
        <h2 className="turn-name">{teamMode ? participant.name : (player?.name ?? participant.name)}</h2>
        <p className="turn-sub">
          {teamMode && player ? (
            <>
              <strong>{player.name}'s turn</strong>
              {role ? ` · ${role}` : ''}
            </>
          ) : (
            role
          )}
        </p>
      </div>
      <div className="turn-meta">
        <RoundIndicator round={session.round} totalRounds={session.settings.totalRounds} label={game.roundLabel} turn={session.turnIndex + 1} totalTurns={session.participants.length} />
        <p className="muted small">{next ? `Up next: ${next.participant.name}${next.round !== session.round ? ` (${game.roundLabel} ${next.round})` : ''}` : 'Final turn of the game'}</p>
      </div>
    </div>
  );
}

/* ---------- Timer controls ---------- */

export function PauseResumeButton({ session, dispatch }: { session: GameSession; dispatch: (a: SessionAction) => void }) {
  if (session.status === 'playing') {
    return (
      <button type="button" className="btn btn-secondary" onClick={() => dispatch({ type: 'pause', now: Date.now() })}>
        <Pause size={16} aria-hidden="true" /> Pause
      </button>
    );
  }
  if (session.status === 'paused') {
    return (
      <button type="button" className="btn btn-secondary" onClick={() => dispatch({ type: 'resume', now: Date.now() })}>
        <Play size={16} aria-hidden="true" /> Resume
      </button>
    );
  }
  return null;
}

export function TimeUpBanner({ children }: { children: ReactNode }) {
  return (
    <div className="timeup-banner" role="alert">
      <AlarmClock size={20} aria-hidden="true" />
      <div>
        <p className="inline-alert-title">Time's up!</p>
        <p>{children}</p>
      </div>
    </div>
  );
}

/* ---------- Turn complete ---------- */

function nextTurnLabel(session: GameSession, game: GameDefinition): string {
  if (isFinalTurn(session)) return 'Finish Game & Review Result';
  if (session.turnIndex >= session.participants.length - 1) return `Finish ${game.roundLabel} ${session.round}`;
  const next = upNext(session);
  return `Next Turn: ${next?.participant.name ?? ''}`;
}

interface TurnCompleteProps {
  session: GameSession;
  game: GameDefinition;
  dispatch: (a: SessionAction) => void;
  drawNext: () => GameContent | null;
  heading: string;
  tone: 'success' | 'neutral' | 'danger';
  children?: ReactNode;
}

export function TurnCompletePanel({ session, game, dispatch, drawNext, heading, tone, children }: TurnCompleteProps) {
  const confirm = useConfirm();
  const events = currentTurnEvents(session);
  const earned = events.reduce((sum, e) => sum + e.points, 0);
  const participant = currentParticipant(session);
  const unit = Math.abs(earned) === 1 ? 'point' : 'points';

  const undo = async () => {
    const ok = await confirm({
      title: 'Change this result?',
      message: 'The last result recorded for this turn will be undone so you can record the correct one.',
      confirmLabel: 'Undo result',
      tone: 'danger',
    });
    if (ok) dispatch({ type: 'undoTurnResult' });
  };

  return (
    <section className={`result-panel tone-${tone}`} aria-labelledby="turn-result-title">
      <p className="eyebrow">Turn complete</p>
      <h2 id="turn-result-title" className="result-title" tabIndex={-1}>
        {heading}
      </h2>
      <p className="result-points">
        {participant.name} earned <strong>{formatPoints(earned)}</strong> {unit} this turn.
      </p>
      {children}
      <div className="btn-row">
        <button type="button" className="btn btn-primary btn-lg" onClick={() => dispatch({ type: 'nextTurn', content: drawNext() })} data-autofocus>
          {nextTurnLabel(session, game)} <ArrowRight size={17} aria-hidden="true" />
        </button>
        {events.length > 0 && (
          <button type="button" className="btn btn-ghost" onClick={() => void undo()}>
            <Undo2 size={16} aria-hidden="true" /> Change result
          </button>
        )}
      </div>
    </section>
  );
}

/* ---------- Round complete ---------- */

export function RoundCompletePanel({ session, game, dispatch, drawNext }: Omit<TurnCompleteProps, 'heading' | 'tone' | 'children'>) {
  const rounds = computeRoundScores(session.participants, session.events, session.round);
  const thisRound = rounds.find((r) => r.round === session.round);
  const standings = computeStandings(session.participants, session.events);
  return (
    <section className="result-panel tone-neutral" aria-labelledby="round-result-title">
      <p className="eyebrow">
        {game.roundLabel} {session.round} of {session.settings.totalRounds} complete
      </p>
      <h2 id="round-result-title" className="result-title">
        End of {game.roundLabel.toLowerCase()} {session.round}
      </h2>
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">{session.mode === 'team' ? 'Team' : 'Player'}</th>
            <th scope="col">This {game.roundLabel.toLowerCase()}</th>
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          {session.participants.map((p) => (
            <tr key={p.id}>
              <th scope="row">{p.name}</th>
              <td>{formatPoints(thisRound?.scores[p.id] ?? 0)}</td>
              <td>
                <strong>{standings.find((s) => s.participantId === p.id)?.score ?? 0}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="btn-row">
        <button type="button" className="btn btn-primary btn-lg" onClick={() => dispatch({ type: 'startNextRound', content: drawNext() })}>
          Start {game.roundLabel} {session.round + 1} <ArrowRight size={17} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
