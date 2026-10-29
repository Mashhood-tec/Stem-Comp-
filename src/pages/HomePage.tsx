import { ArrowRight, Gavel, Play, Sparkles, Trophy, Users } from 'lucide-react';
import { GameCard, GameIconTile, formatLabel } from '../components/GameCard';
import { OriginBadge } from '../components/ChallengeCard';
import { GAMES, getGame } from '../games/definitions';
import { heritageRiddles } from '../games/heritageRiddleRelay/content';
import { useApp } from '../state/AppContext';

const STEPS = [
  { icon: Users, title: 'Choose your game and players', text: 'Pick one of five games, then set up players and teams in seconds.' },
  { icon: Sparkles, title: 'Use AI-created challenges to play together', text: 'Riddles, missions, story scenarios and prompts appear right in the game.' },
  { icon: Trophy, title: 'Record scores and celebrate the winner', text: 'The host confirms every result. The app keeps time, turns and scores.' },
];

const sampleRiddle = heritageRiddles[1];

export function HomePage() {
  const { navigate, game } = useApp();
  const active = game.session ? getGame(game.session.gameId) : undefined;

  return (
    <div className="page">
      <section className="hero container">
        <div className="hero-copy">
          <p className="kicker">
            <span className="kicker-dot" aria-hidden="true" /> Culture · Heritage · Sport
          </p>
          <h1 className="display">Bring Everyone Together.</h1>
          <p className="lead">Five games. One family. Endless ways to play.</p>
          <div className="btn-row">
            <button type="button" className="btn btn-primary btn-lg" onClick={() => navigate(active ? '/play' : '/games')}>
              <Play size={18} aria-hidden="true" /> {active ? `Resume ${active.name}` : 'Start Playing'}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-lg"
              onClick={() => {
                const grid = document.getElementById('games-grid');
                grid?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
                grid?.focus({ preventScroll: true });
              }}
            >
              Explore Games
            </button>
          </div>
          <p className="host-note">
            <Gavel size={15} aria-hidden="true" /> A human host controls scoring and confirms every result.
          </p>
        </div>

        <aside className="hero-preview" aria-label="Example of an AI-created challenge used in play">
          <div className="preview-device">
            <div className="preview-head">
              <span className="eyebrow">UAE Heritage Riddle Relay</span>
              <OriginBadge origin={sampleRiddle.origin} />
            </div>
            <p className="preview-turn">
              <strong>Team A</strong> · P2's turn · Round 2
            </p>
            <h2 className="preview-title">{sampleRiddle.title}</h2>
            <p className="preview-text">{sampleRiddle.riddle}</p>
            <details className="preview-answer">
              <summary>Reveal answer</summary>
              <p>
                <strong>{sampleRiddle.answer}.</strong> {sampleRiddle.explanation}
              </p>
            </details>
          </div>
        </aside>
      </section>

      <section className="container section" aria-labelledby="lineup-title">
        <h2 id="lineup-title" className="sr-only">
          The five games
        </h2>
        <ul className="lineup">
          {GAMES.map((g) => (
            <li key={g.id}>
              <a href={`#/setup/${g.id}`} className="lineup-item">
                <GameIconTile game={g} size="sm" />
                <span>
                  <span className="lineup-name">{g.name}</span>
                  <span className="lineup-meta">
                    {formatLabel(g)} · {g.durationLabel}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="container section" id="games-grid" tabIndex={-1} aria-labelledby="choose-title">
        <div className="section-head">
          <div>
            <p className="eyebrow">The collection</p>
            <h2 id="choose-title" className="section-title-lg">
              Choose Your Next Challenge
            </h2>
          </div>
          <a href="#/games" className="link-arrow">
            Filter games <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
        <div className="game-grid">
          {GAMES.map((g, i) => (
            <GameCard key={g.id} game={g} index={i} onPlay={() => navigate(`/setup/${g.id}`)} />
          ))}
        </div>
      </section>

      <section className="container section" aria-labelledby="how-title">
        <div className="section-head">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 id="how-title" className="section-title-lg">
              Three steps to game day
            </h2>
          </div>
        </div>
        <ol className="steps">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="step">
              <span className="step-num">{i + 1}</span>
              <Icon size={22} strokeWidth={1.6} aria-hidden="true" />
              <h3 className="step-title">{title}</h3>
              <p className="muted">{text}</p>
            </li>
          ))}
        </ol>
        <p className="host-banner">
          <Gavel size={18} aria-hidden="true" />
          <span>
            <strong>The host is the judge.</strong> The app never watches players or judges answers. The host confirms answers, goals, points, penalties and the final result.
          </span>
        </p>
      </section>
    </div>
  );
}
