import { CircleAlert, LoaderCircle, Repeat, RotateCcw, Sparkles, WandSparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ContentOrigin, GameContent } from '../types/content';

export interface GeneratorControls {
  loading: boolean;
  error: string | null;
  liveConfigured: boolean;
  generate: () => void;
  usePrepared: () => void;
  reuse: () => void;
}

export function OriginBadge({ origin }: { origin: ContentOrigin }) {
  if (origin === 'live') {
    return (
      <span className="origin-badge is-live" title="Generated just now by the live AI service">
        <WandSparkles size={13} aria-hidden="true" />
        Live AI-generated
      </span>
    );
  }
  return (
    <span className="origin-badge" title="Created with AI for this project and checked by the team. Not generated live.">
      <Sparkles size={13} aria-hidden="true" />
      AI-created · prepared set
    </span>
  );
}

interface ChallengeCardProps {
  label: string;
  content: GameContent | null;
  generator?: GeneratorControls;
  canGenerate?: boolean;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
  /** Replaces the content title, e.g. when the title itself is secret. */
  title?: string;
}

export function ChallengeCard({ label, content, generator, canGenerate = false, children, actions, className = '', title }: ChallengeCardProps) {
  return (
    <section className={`challenge-card ${className}`} aria-labelledby="challenge-title" aria-busy={generator?.loading || undefined}>
      <header className="challenge-head">
        <div className="challenge-head-text">
          <p className="eyebrow">{label}</p>
          <h2 id="challenge-title" className="challenge-title">
            {content ? (title ?? content.title) : 'No challenge loaded'}
          </h2>
        </div>
        {content && (
          <div className="challenge-badges">
            <OriginBadge origin={content.origin} />
            <span className="chip">{content.difficulty}</span>
          </div>
        )}
      </header>

      <div className="challenge-body">
        {content ? (
          children
        ) : (
          <div className="exhausted">
            <p>
              Every prepared {label.toLowerCase()} for this game has already been used in this session, so nothing repeats unless you choose to.
            </p>
            <div className="btn-row">
              {generator && (
                <button type="button" className="btn btn-secondary" onClick={generator.reuse}>
                  <Repeat size={16} aria-hidden="true" /> Reuse prepared challenges
                </button>
              )}
              {generator?.liveConfigured && (
                <button type="button" className="btn btn-ghost" onClick={generator.generate} disabled={generator.loading}>
                  <WandSparkles size={16} aria-hidden="true" /> Generate with live AI
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {generator?.error && (
        <div className="inline-alert" role="alert">
          <CircleAlert size={18} aria-hidden="true" />
          <div>
            <p className="inline-alert-title">Live generation didn't work</p>
            <p>{generator.error} The current challenge is unchanged.</p>
            <div className="btn-row">
              <button type="button" className="btn btn-secondary btn-sm" onClick={generator.generate}>
                <RotateCcw size={15} aria-hidden="true" /> Retry
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={generator.usePrepared}>
                Use a prepared challenge
              </button>
            </div>
          </div>
        </div>
      )}

      {(actions || (generator && canGenerate)) && (
        <footer className="challenge-foot">
          {actions}
          {generator && canGenerate && (
            <button type="button" className="btn btn-ghost btn-sm generate-btn" onClick={generator.generate} disabled={generator.loading}>
              {generator.loading ? (
                <>
                  <LoaderCircle size={15} className="spin" aria-hidden="true" /> Generating with live AI…
                </>
              ) : (
                <>
                  <WandSparkles size={15} aria-hidden="true" /> Generate New Challenge
                </>
              )}
            </button>
          )}
        </footer>
      )}
      {generator?.loading && (
        <p className="sr-only" role="status">
          Generating a new challenge with live AI.
        </p>
      )}
    </section>
  );
}
