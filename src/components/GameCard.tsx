import { ArrowRight, Clock, Sparkles, Users } from 'lucide-react';
import type { GameDefinition } from '../types/game';

export function formatLabel(game: GameDefinition): string {
  if (game.modes.length > 1) return 'Team or Individual';
  return game.modes[0] === 'team' ? 'Team' : 'Individual';
}

export function playerRangeLabel(game: GameDefinition): string {
  const limits = Object.values(game.limits);
  const min = Math.min(...limits.map((l) => l.minPlayers));
  const max = Math.max(...limits.map((l) => l.maxPlayers));
  return `${min}–${max} players`;
}

export function GameIconTile({ game, size = 'md' }: { game: GameDefinition; size?: 'sm' | 'md' | 'lg' }) {
  const Icon = game.icon;
  const px = size === 'lg' ? 34 : size === 'sm' ? 18 : 26;
  return (
    <span className={`game-icon game-icon-${size} game-icon-${game.id}`} aria-hidden="true">
      <Icon size={px} strokeWidth={1.6} />
    </span>
  );
}

export function GameCard({ game, index, onPlay }: { game: GameDefinition; index: number; onPlay: () => void }) {
  return (
    <article className="game-card" aria-labelledby={`game-${game.id}-title`}>
      <div className="game-card-top">
        <GameIconTile game={game} />
        <span className="game-card-number" aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>
      <p className="eyebrow">{game.category}</p>
      <h3 id={`game-${game.id}-title`} className="game-card-title">
        {game.name}
      </h3>
      <p className="game-card-desc">{game.description}</p>
      <ul className="meta-list" aria-label="Game details">
        <li>
          <Users size={14} aria-hidden="true" />
          {formatLabel(game)}
        </li>
        <li>
          <Clock size={14} aria-hidden="true" />
          {game.durationLabel}
        </li>
        <li>{playerRangeLabel(game)}</li>
      </ul>
      <p className="ai-note">
        <Sparkles size={14} aria-hidden="true" />
        {game.aiUse}
      </p>
      <button type="button" className="btn btn-primary game-card-cta" onClick={onPlay} aria-label={`Play ${game.name}`}>
        Play Game <ArrowRight size={16} aria-hidden="true" />
      </button>
    </article>
  );
}
