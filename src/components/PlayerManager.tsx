import { Plus, Shuffle, Trash2, UserPlus, Users } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import type { GameDefinition, PlayMode } from '../types/game';
import type { Player, Team } from '../types/session';
import { createId } from '../utils/id';
import { MAX_NAME_LENGTH, type SetupValidation } from '../utils/validation';

interface PlayerManagerProps {
  game: GameDefinition;
  mode: PlayMode;
  players: Player[];
  teams: Team[];
  onChange: (next: { players: Player[]; teams: Team[] }) => void;
  validation: SetupValidation;
  showErrors: boolean;
}

function nextDefaultName(players: Player[]): string {
  const taken = new Set(players.map((p) => p.name.trim().toLowerCase()));
  let n = players.length + 1;
  while (taken.has(`p${n}`)) n += 1;
  return `P${n}`;
}

function nextTeamName(teams: Team[]): string {
  const taken = new Set(teams.map((t) => t.name.trim().toLowerCase()));
  for (let code = 65; code <= 90; code += 1) {
    const name = `Team ${String.fromCharCode(code)}`;
    if (!taken.has(name.toLowerCase())) return name;
  }
  return `Team ${teams.length + 1}`;
}

function smallestTeamId(teams: Team[], players: Player[], excludeId?: string): string | null {
  const candidates = teams.filter((t) => t.id !== excludeId);
  if (candidates.length === 0) return null;
  return candidates.reduce((best, team) => {
    const size = (id: string) => players.filter((p) => p.teamId === id).length;
    return size(team.id) < size(best.id) ? team : best;
  }).id;
}

export function PlayerManager({ game, mode, players, teams, onChange, validation, showErrors }: PlayerManagerProps) {
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const limits = game.limits[mode];
  const teamMode = mode === 'team';
  const maxTeams = limits?.maxTeams ?? 4;
  const atMaxPlayers = limits ? players.length >= limits.maxPlayers : false;

  const update = (nextPlayers: Player[], nextTeams: Team[] = teams) => onChange({ players: nextPlayers, teams: nextTeams });

  const addPlayer = (event: FormEvent) => {
    event.preventDefault();
    const name = newName.trim() || nextDefaultName(players);
    if (name.length > MAX_NAME_LENGTH) return setAddError(`Use ${MAX_NAME_LENGTH} characters or fewer.`);
    if (players.some((p) => p.name.trim().toLowerCase() === name.toLowerCase())) return setAddError(`"${name}" is already playing. Choose a different name.`);
    if (atMaxPlayers) return setAddError(`${game.name} allows at most ${limits?.maxPlayers} players.`);
    update([...players, { id: createId('player'), name, teamId: smallestTeamId(teams, players) }]);
    setNewName('');
    setAddError(null);
    requestAnimationFrame(() => listRef.current?.querySelector<HTMLInputElement>('li:last-child input')?.focus());
  };

  const renamePlayer = (id: string, name: string) => update(players.map((p) => (p.id === id ? { ...p, name } : p)));
  const removePlayer = (id: string) => update(players.filter((p) => p.id !== id));
  const setTeam = (id: string, teamId: string) => update(players.map((p) => (p.id === id ? { ...p, teamId } : p)));

  const addTeam = () => {
    if (teams.length >= maxTeams) return;
    update(players, [...teams, { id: createId('team'), name: nextTeamName(teams) }]);
  };
  const renameTeam = (id: string, name: string) => update(players, teams.map((t) => (t.id === id ? { ...t, name } : t)));
  const removeTeam = (id: string) => {
    if (teams.length <= 1) return;
    const remaining = teams.filter((t) => t.id !== id);
    let moved = players;
    for (const player of players.filter((p) => p.teamId === id)) {
      const target = smallestTeamId(remaining, moved);
      moved = moved.map((p) => (p.id === player.id ? { ...p, teamId: target } : p));
    }
    update(moved, remaining);
  };
  const shuffleTeams = () => {
    if (teams.length === 0) return;
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const assignment = new Map(shuffled.map((p, i) => [p.id, teams[i % teams.length].id]));
    update(players.map((p) => ({ ...p, teamId: assignment.get(p.id) ?? p.teamId })));
  };

  const errorFor = (id: string) => (showErrors ? validation.playerErrors[id] : undefined);
  const teamErrorFor = (id: string) => (showErrors ? validation.teamErrors[id] : undefined);

  return (
    <div className={`setup-grid ${teamMode ? '' : 'is-single'}`}>
      <section className="panel" aria-labelledby="players-title">
        <div className="panel-head">
          <h2 id="players-title" className="panel-title">
            <Users size={18} aria-hidden="true" /> Players
          </h2>
          <span className="panel-meta">
            {players.length} of {limits?.minPlayers}–{limits?.maxPlayers}
          </span>
        </div>

        {players.length === 0 ? (
          <p className="muted">No players yet. Add at least {limits?.minPlayers} to play.</p>
        ) : (
          <ol className="player-list" ref={listRef}>
            {players.map((player, index) => {
              const error = errorFor(player.id);
              const inputId = `player-${player.id}`;
              return (
                <li key={player.id} className={`player-row ${error ? 'has-error' : ''}`}>
                  <span className="player-index" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div className="field grow">
                    <label htmlFor={inputId} className="sr-only">
                      Player {index + 1} name
                    </label>
                    <input
                      id={inputId}
                      className="input"
                      value={player.name}
                      maxLength={MAX_NAME_LENGTH + 5}
                      onChange={(e) => renamePlayer(player.id, e.target.value)}
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? `${inputId}-error` : undefined}
                      autoComplete="off"
                    />
                    {error && (
                      <p id={`${inputId}-error`} className="field-error">
                        {error}
                      </p>
                    )}
                  </div>
                  {teamMode && (
                    <div className="field">
                      <label htmlFor={`${inputId}-team`} className="sr-only">
                        Team for {player.name || `player ${index + 1}`}
                      </label>
                      <select
                        id={`${inputId}-team`}
                        className="input select"
                        value={player.teamId && teams.some((t) => t.id === player.teamId) ? player.teamId : ''}
                        onChange={(e) => setTeam(player.id, e.target.value)}
                      >
                        <option value="" disabled>
                          Choose team
                        </option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name || 'Unnamed team'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <button type="button" className="icon-btn" onClick={() => removePlayer(player.id)} aria-label={`Remove ${player.name || `player ${index + 1}`}`}>
                    <Trash2 size={16} />
                  </button>
                </li>
              );
            })}
          </ol>
        )}

        <form className="add-row" onSubmit={addPlayer} noValidate>
          <div className="field grow">
            <label htmlFor="new-player" className="sr-only">
              New player name
            </label>
            <input
              id="new-player"
              className="input"
              placeholder={`New player name (e.g. ${nextDefaultName(players)})`}
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setAddError(null);
              }}
              aria-invalid={Boolean(addError)}
              aria-describedby={addError ? 'new-player-error' : undefined}
              autoComplete="off"
            />
            {addError && (
              <p id="new-player-error" className="field-error" role="alert">
                {addError}
              </p>
            )}
          </div>
          <button type="submit" className="btn btn-secondary" disabled={atMaxPlayers}>
            <UserPlus size={16} aria-hidden="true" /> Add Player
          </button>
        </form>
      </section>

      {teamMode && (
        <section className="panel" aria-labelledby="teams-title">
          <div className="panel-head">
            <h2 id="teams-title" className="panel-title">
              Teams
            </h2>
            <div className="btn-row tight">
              <button type="button" className="btn btn-ghost btn-sm" onClick={shuffleTeams} disabled={teams.length < 2 || players.length < 2}>
                <Shuffle size={15} aria-hidden="true" /> Shuffle
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addTeam} disabled={teams.length >= maxTeams}>
                <Plus size={15} aria-hidden="true" /> Add Team
              </button>
            </div>
          </div>
          <div className="team-grid">
            {teams.map((team) => {
              const members = players.filter((p) => p.teamId === team.id);
              const error = teamErrorFor(team.id);
              const inputId = `team-${team.id}`;
              return (
                <div key={team.id} className={`team-card ${error ? 'has-error' : ''}`}>
                  <div className="team-card-head">
                    <div className="field grow">
                      <label htmlFor={inputId} className="sr-only">
                        Team name
                      </label>
                      <input
                        id={inputId}
                        className="input input-strong"
                        value={team.name}
                        maxLength={MAX_NAME_LENGTH + 5}
                        onChange={(e) => renameTeam(team.id, e.target.value)}
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? `${inputId}-error` : undefined}
                        autoComplete="off"
                      />
                    </div>
                    <button type="button" className="icon-btn" onClick={() => removeTeam(team.id)} disabled={teams.length <= 1} aria-label={`Remove ${team.name || 'team'}`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {error && (
                    <p id={`${inputId}-error`} className="field-error">
                      {error}
                    </p>
                  )}
                  <p className="team-count">
                    {members.length} player{members.length === 1 ? '' : 's'}
                  </p>
                  {members.length > 0 ? (
                    <ul className="member-chips" aria-label={`${team.name} members`}>
                      {members.map((member) => (
                        <li key={member.id} className="member-chip">
                          {member.name.trim() || 'Unnamed'}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted small">No players yet. Choose this team in the player list.</p>
                  )}
                </div>
              );
            })}
          </div>
          {limits && (
            <p className="panel-foot">
              {limits.minTeams === limits.maxTeams ? `Exactly ${limits.maxTeams} teams` : `${limits.minTeams}–${limits.maxTeams} teams`}
              {limits.minPerTeam ? ` · at least ${limits.minPerTeam} per team` : ''}
              {limits.maxTeamSizeDifference !== undefined ? ` · sizes may differ by ${limits.maxTeamSizeDifference} at most` : ''}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
