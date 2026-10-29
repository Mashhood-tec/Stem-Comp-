import { CircleMinus, Gavel, ListChecks, Scale, Target, Trophy, Award } from 'lucide-react';
import type { GameDefinition } from '../types/game';

export function RulesPanel({ game }: { game: GameDefinition }) {
  const { rules } = game;
  return (
    <section className="panel rules-panel" aria-labelledby="rules-title">
      <h2 id="rules-title" className="section-title">
        How to play {game.name}
      </h2>
      <div className="rules-objective">
        <Target size={18} aria-hidden="true" />
        <p>
          <strong>Objective.</strong> {rules.objective}
        </p>
      </div>

      <div className="rules-block">
        <h3 className="rules-heading">
          <ListChecks size={16} aria-hidden="true" /> Instructions
        </h3>
        <ol className="rules-steps">
          {rules.howToPlay.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="rules-grid">
        <div className="rules-block">
          <h3 className="rules-heading">
            <Award size={16} aria-hidden="true" /> Points
          </h3>
          <ul className="rules-list">
            {rules.points.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="rules-block">
          <h3 className="rules-heading">
            <CircleMinus size={16} aria-hidden="true" /> Penalties
          </h3>
          <ul className="rules-list">
            {rules.penalties.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="rules-block">
          <h3 className="rules-heading">
            <Scale size={16} aria-hidden="true" /> Tie-break
          </h3>
          <p>{rules.tieBreak}</p>
        </div>
        <div className="rules-block">
          <h3 className="rules-heading">
            <Gavel size={16} aria-hidden="true" /> Host confirms
          </h3>
          <p>{rules.hostConfirms}</p>
        </div>
      </div>

      <div className="rules-objective is-winning">
        <Trophy size={18} aria-hidden="true" />
        <p>
          <strong>Winning.</strong> {rules.winning}
        </p>
      </div>
    </section>
  );
}
