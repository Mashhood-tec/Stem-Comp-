import { useState } from 'react';
import { GameCard } from '../components/GameCard';
import { GAMES } from '../games/definitions';
import { useApp } from '../state/AppContext';
import type { GameDefinition } from '../types/game';

const FILTERS: { id: string; label: string; test: (g: GameDefinition) => boolean }[] = [
  { id: 'all', label: 'All Games', test: () => true },
  { id: 'team', label: 'Team Games', test: (g) => g.modes.includes('team') },
  { id: 'individual', label: 'Individual Games', test: (g) => g.modes.includes('individual') },
  { id: 'quick', label: 'Quick Games', test: (g) => g.quick },
];

export function GameSelectionPage() {
  const { navigate } = useApp();
  const [filter, setFilter] = useState('all');
  const active = FILTERS.find((f) => f.id === filter) ?? FILTERS[0];
  const games = GAMES.filter(active.test);

  return (
    <div className="page container">
      <header className="page-head">
        <p className="eyebrow">Step 1 · Choose a game</p>
        <h1 className="page-title">Pick today's game</h1>
        <p className="lead-sm">Every game uses AI-created content that the family plays with: riddles, missions, story scenarios, acting prompts and quick-fire challenges.</p>
      </header>

      <div className="filter-bar" role="group" aria-label="Filter games">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" className={`filter-chip ${filter === f.id ? 'is-active' : ''}`} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
            <span className="filter-count">{GAMES.filter(f.test).length}</span>
          </button>
        ))}
      </div>
      <p className="muted small" role="status">
        Showing {games.length} of {GAMES.length} games
      </p>

      <div className="game-grid">
        {games.map((g) => (
          <GameCard key={g.id} game={g} index={GAMES.indexOf(g)} onPlay={() => navigate(`/setup/${g.id}`)} />
        ))}
      </div>
    </div>
  );
}
