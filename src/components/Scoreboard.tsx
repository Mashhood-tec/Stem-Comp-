import { Minus, Plus, Star } from 'lucide-react';
import { useState } from 'react';
import type { GameSession } from '../types/session';
import { computeStandings } from '../utils/scoring';

interface ScoreboardProps {
  session: GameSession;
  activeId?: string | null;
  onAdjust?: (participantId: string, delta: 1 | -1) => void;
  canAdjust?: boolean;
}

export function Scoreboard({ session, activeId, onAdjust, canAdjust = false }: ScoreboardProps) {
  const [adjusting, setAdjusting] = useState(false);
  const standings = computeStandings(session.participants, session.events);
  const isFootball = session.gameId === 'football';
  const top = Math.max(...standings.map((s) => s.score));
  const soleLeader = standings.filter((s) => s.score === top).length === 1;
  const playerName = (id: string) => session.players.find((p) => p.id === id)?.name ?? '';

  return (
    <section className="panel scoreboard" aria-labelledby="scoreboard-title">
      <div className="panel-head">
        <h2 id="scoreboard-title" className="panel-title">
          Scoreboard
        </h2>
        {onAdjust && (
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => setAdjusting((v) => !v)}
            aria-expanded={adjusting}
            disabled={!canAdjust}
            title={canAdjust ? undefined : 'Scores can be adjusted between and during turns'}
          >
            {adjusting ? 'Done' : 'Adjust'}
          </button>
        )}
      </div>
      <ul className="score-list">
        {session.participants.map((participant) => {
          const standing = standings.find((s) => s.participantId === participant.id)!;
          const active = participant.id === activeId;
          const leading = standing.score === top && top > 0 && soleLeader;
          return (
            <li key={participant.id} className={`score-row ${active ? 'is-active' : ''}`} aria-current={active ? 'true' : undefined}>
              <div className="score-name">
                <span className="score-team">
                  {participant.name}
                  {active && <span className="tag tag-accent">Now playing</span>}
                  {leading && !active && <span className="tag">Leading</span>}
                </span>
                {session.mode === 'team' && <span className="score-members">{participant.memberIds.map(playerName).join(', ')}</span>}
                {isFootball && (
                  <span className="score-members">
                    <Star size={12} aria-hidden="true" /> {standing.missions} mission star{standing.missions === 1 ? '' : 's'}
                  </span>
                )}
              </div>
              <div className="score-value-wrap">
                {adjusting && onAdjust && canAdjust && (
                  <span className="adjust-btns">
                    <button type="button" className="icon-btn icon-btn-sm" onClick={() => onAdjust(participant.id, -1)} aria-label={`Remove 1 point from ${participant.name}`}>
                      <Minus size={14} />
                    </button>
                    <button type="button" className="icon-btn icon-btn-sm" onClick={() => onAdjust(participant.id, 1)} aria-label={`Add 1 point to ${participant.name}`}>
                      <Plus size={14} />
                    </button>
                  </span>
                )}
                <span className="score-value" aria-label={`${standing.score} ${isFootball ? 'goals' : 'points'}`}>
                  {standing.score}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="panel-foot">{isFootball ? 'Goals confirmed by the host' : 'Points confirmed by the host'}</p>
    </section>
  );
}
