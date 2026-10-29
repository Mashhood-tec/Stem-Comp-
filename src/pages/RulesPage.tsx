import { ArrowLeft, CircleCheck, ClipboardList, Play, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { GameIconTile } from '../components/GameCard';
import { RulesPanel } from '../components/RulesPanel';
import { buildParticipants } from '../engine/session';
import { getGame } from '../games/definitions';
import { useStartGame } from '../hooks/useStartGame';
import { useApp } from '../state/AppContext';
import { formatDuration } from '../utils/format';
import { validateSetup } from '../utils/validation';

export function RulesPage() {
  const { draft, navigate } = useApp();
  const game = getGame(draft?.gameId);
  const startGame = useStartGame();
  const [turnSeconds, setTurnSeconds] = useState(game?.defaultTime ?? 60);
  const [rounds, setRounds] = useState(game?.defaultRounds ?? 2);
  const [ready, setReady] = useState(false);
  const [starting, setStarting] = useState(false);

  if (!draft || !game || !validateSetup(game, draft.mode, draft.players, draft.teams).valid) {
    return (
      <div className="page container">
        <EmptyState icon={ClipboardList} title="Set up players first" actions={<a href="#/games" className="btn btn-primary">Choose a game</a>}>
          <p>Choose a game and confirm its players and teams before reviewing the rules.</p>
        </EmptyState>
      </div>
    );
  }

  const participants = buildParticipants(draft.mode, draft.players, draft.teams);
  const playerName = (id: string) => draft.players.find((p) => p.id === id)?.name ?? '';

  const start = async () => {
    if (!ready || starting) return;
    setStarting(true);
    const started = await startGame({ gameId: game.id, mode: draft.mode, players: draft.players, teams: draft.teams, turnSeconds, totalRounds: rounds });
    if (!started) setStarting(false);
  };

  return (
    <div className="page container">
      <button type="button" className="back-link" onClick={() => navigate(`/setup/${game.id}`)}>
        <ArrowLeft size={16} aria-hidden="true" /> Back to Setup
      </button>
      <header className="page-head with-icon">
        <GameIconTile game={game} size="lg" />
        <div>
          <p className="eyebrow">Step 3 · Rules & ready</p>
          <h1 className="page-title">{game.name}</h1>
          <p className="lead-sm lead-icon">
            <Sparkles size={15} aria-hidden="true" />
            <span>{game.aiUse}</span>
          </p>
        </div>
      </header>

      <div className="rules-layout">
        <RulesPanel game={game} />

        <div className="rules-side">
          <section className="panel" aria-labelledby="settings-heading">
            <h2 id="settings-heading" className="panel-title">
              Game settings
            </h2>
            <fieldset className="option-group">
              <legend className="field-label">{game.timeLabel}</legend>
              <div className="segmented wrap">
                {game.timeOptions.map((seconds) => (
                  <label key={seconds} className={`segment ${turnSeconds === seconds ? 'is-active' : ''}`}>
                    <input type="radio" name="time" checked={turnSeconds === seconds} onChange={() => setTurnSeconds(seconds)} />
                    {formatDuration(seconds)}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="option-group">
              <legend className="field-label">{game.roundsLabel}</legend>
              <div className="segmented wrap">
                {game.roundOptions.map((count) => (
                  <label key={count} className={`segment ${rounds === count ? 'is-active' : ''}`}>
                    <input type="radio" name="rounds" checked={rounds === count} onChange={() => setRounds(count)} />
                    {count}
                  </label>
                ))}
              </div>
            </fieldset>
            <p className="muted small">
              {game.id === 'football'
                ? `${rounds} period${rounds === 1 ? '' : 's'} of ${formatDuration(turnSeconds)}.`
                : `${rounds} ${(rounds === 1 ? game.roundLabel : game.roundsLabel).toLowerCase()} × ${participants.length} turns = ${rounds * participants.length} turns of ${formatDuration(turnSeconds)}.`}
            </p>
          </section>

          <section className="panel" aria-labelledby="lineup-heading">
            <h2 id="lineup-heading" className="panel-title">
              {draft.mode === 'team' ? 'Teams' : 'Players'} · turn order
            </h2>
            <ol className="lineup-order">
              {participants.map((p) => (
                <li key={p.id}>
                  <strong>{p.name}</strong>
                  {draft.mode === 'team' && <span className="muted"> — {p.memberIds.map(playerName).join(', ')}</span>}
                </li>
              ))}
            </ol>
          </section>

          <section className={`panel ready-panel ${ready ? 'is-ready' : ''}`} aria-labelledby="ready-heading">
            <h2 id="ready-heading" className="panel-title">
              Everyone Ready?
            </h2>
            <p className="muted small">Read the rules aloud, then confirm everyone understands. The timer only starts when the host begins the first turn.</p>
            <button type="button" className={`btn ${ready ? 'btn-accent' : 'btn-secondary'} btn-block`} aria-pressed={ready} onClick={() => setReady((r) => !r)}>
              <CircleCheck size={17} aria-hidden="true" /> {ready ? 'Everyone is ready — confirmed' : 'Everyone Is Ready'}
            </button>
            <button type="button" className="btn btn-primary btn-block btn-lg" onClick={start} disabled={!ready || starting}>
              <Play size={18} aria-hidden="true" /> Start Game
            </button>
            {!ready && <p className="muted small center">Confirm everyone is ready to enable Start Game.</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
