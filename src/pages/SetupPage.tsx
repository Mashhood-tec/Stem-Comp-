import { ArrowLeft, ArrowRight, CircleAlert, Save, SearchX, User, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { GameIconTile } from '../components/GameCard';
import { PlayerManager } from '../components/PlayerManager';
import { useToast } from '../components/Toast';
import { getGame } from '../games/definitions';
import { useApp } from '../state/AppContext';
import type { GameDefinition, PlayMode } from '../types/game';
import type { Player, Team } from '../types/session';
import { validateSetup } from '../utils/validation';

function limitsSummary(game: GameDefinition, mode: PlayMode): string {
  const l = game.limits[mode];
  if (!l) return '';
  const parts = [`${l.minPlayers}–${l.maxPlayers} players`];
  if (mode === 'team') {
    parts.push(l.minTeams === l.maxTeams ? `exactly ${l.maxTeams} teams` : `${l.minTeams}–${l.maxTeams} teams`);
    if (l.minPerTeam && l.minPerTeam > 1) parts.push(`${l.minPerTeam}+ players per team`);
    if (l.maxTeamSizeDifference !== undefined) parts.push('balanced team sizes');
  }
  return parts.join(' · ');
}

export function SetupPage({ gameId }: { gameId: string | undefined }) {
  const game = getGame(gameId);
  if (!game) {
    return (
      <div className="page container">
        <EmptyState icon={SearchX} title="Game not found" actions={<a href="#/games" className="btn btn-primary">Choose a game</a>}>
          <p>That game doesn't exist. Pick one of the five games instead.</p>
        </EmptyState>
      </div>
    );
  }
  return <SetupForm key={game.id} game={game} />;
}

function SetupForm({ game }: { game: GameDefinition }) {
  const { roster, setRoster, draft, setDraft, navigate } = useApp();
  const toast = useToast();
  const fromDraft = draft?.gameId === game.id ? draft : null;
  const [mode, setMode] = useState<PlayMode>(fromDraft?.mode ?? game.defaultMode);
  const [players, setPlayers] = useState<Player[]>(fromDraft?.players ?? roster.players);
  const [teams, setTeams] = useState<Team[]>(fromDraft?.teams ?? roster.teams);
  const [showErrors, setShowErrors] = useState(false);

  const validation = useMemo(() => validateSetup(game, mode, players, teams), [game, mode, players, teams]);
  const nameIssues = Object.keys(validation.playerErrors).some((id) => validation.playerErrors[id] !== 'Choose a team.') || Object.keys(validation.teamErrors).some((id) => validation.teamErrors[id].includes('name'));

  const save = () => {
    if (nameIssues) {
      setShowErrors(true);
      toast.error('Fix the highlighted names before saving.');
      return false;
    }
    setRoster({ players: players.map((p) => ({ ...p, name: p.name.trim() })), teams: teams.map((t) => ({ ...t, name: t.name.trim() })) });
    return true;
  };

  const onSave = () => {
    if (save()) toast.success('Players & teams saved on this device.');
  };

  const onContinue = () => {
    setShowErrors(true);
    if (!validation.valid) {
      document.getElementById('setup-errors')?.focus();
      return;
    }
    save();
    setDraft({ gameId: game.id, mode, players, teams });
    navigate('/rules');
  };

  return (
    <div className="page container">
      <a href="#/games" className="back-link">
        <ArrowLeft size={16} aria-hidden="true" /> All games
      </a>
      <header className="page-head with-icon">
        <GameIconTile game={game} size="lg" />
        <div>
          <p className="eyebrow">Step 2 · Players & teams</p>
          <h1 className="page-title">{game.name}</h1>
          <p className="lead-sm">
            Limits: <strong>{limitsSummary(game, mode)}</strong>
          </p>
        </div>
      </header>

      {game.modes.length > 1 && (
        <fieldset className="mode-toggle">
          <legend className="field-label">How will you play?</legend>
          <div className="segmented">
            {game.modes.map((m) => (
              <label key={m} className={`segment ${mode === m ? 'is-active' : ''}`}>
                <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} />
                {m === 'team' ? <Users size={16} aria-hidden="true" /> : <User size={16} aria-hidden="true" />}
                {m === 'team' ? 'Teams' : 'Individual players'}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <PlayerManager
        game={game}
        mode={mode}
        players={players}
        teams={teams}
        onChange={(next) => {
          setPlayers(next.players);
          setTeams(next.teams);
        }}
        validation={validation}
        showErrors={showErrors}
      />

      {showErrors && !validation.valid && (
        <div id="setup-errors" className="error-summary" role="alert" tabIndex={-1}>
          <CircleAlert size={18} aria-hidden="true" />
          <div>
            <p className="inline-alert-title">This setup can't start yet</p>
            <ul>
              {validation.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="action-bar">
        <button type="button" className="btn btn-ghost" onClick={onSave}>
          <Save size={16} aria-hidden="true" /> Save Players & Teams
        </button>
        <button type="button" className="btn btn-primary" onClick={onContinue}>
          Continue to Rules <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
