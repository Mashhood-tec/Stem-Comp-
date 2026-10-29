import { Timer } from 'lucide-react';
import type { SessionStatus } from '../types/session';
import { formatClock } from '../utils/format';

const STATE_LABEL: Partial<Record<SessionStatus, string>> = {
  ready: 'Not started',
  playing: 'Running',
  paused: 'Paused',
  timeUp: "Time's up",
  turnComplete: 'Stopped',
  roundComplete: 'Stopped',
  review: 'Stopped',
};

interface GameTimerProps {
  remainingMs: number;
  durationMs: number;
  status: SessionStatus;
  label?: string;
  size?: 'md' | 'lg';
}

export function GameTimer({ remainingMs, durationMs, status, label = 'Time left', size = 'lg' }: GameTimerProps) {
  const fraction = durationMs > 0 ? Math.min(1, Math.max(0, remainingMs / durationMs)) : 0;
  const urgent = status === 'playing' && remainingMs <= 10_000;
  const expired = status === 'timeUp' || (remainingMs <= 0 && status !== 'ready');
  const stateLabel = STATE_LABEL[status] ?? '';

  return (
    <div className={`timer timer-${size} ${urgent ? 'is-urgent' : ''} ${expired ? 'is-expired' : ''} ${status === 'paused' ? 'is-paused' : ''}`}>
      <div className="timer-label">
        <Timer size={15} aria-hidden="true" />
        <span>{label}</span>
        <span className="timer-state">{urgent ? 'Final seconds' : stateLabel}</span>
      </div>
      <div className="timer-digits" role="timer" aria-label={`${label}: ${formatClock(remainingMs)}, ${stateLabel}`}>
        {formatClock(remainingMs)}
      </div>
      <div className="timer-track" aria-hidden="true">
        <div className="timer-fill" style={{ transform: `scaleX(${fraction})` }} />
      </div>
    </div>
  );
}
