import { Undo2 } from 'lucide-react';
import type { GameSession, ScoreEvent } from '../types/session';
import { useConfirm } from './ConfirmationDialog';

const KIND_LABEL: Record<ScoreEvent['kind'], string> = {
  correct: 'Correct',
  incorrect: 'Incorrect',
  skip: 'Skipped',
  timeout: 'No answer',
  goal: 'Goal',
  penalty: 'Penalty',
  bonus: 'Bonus',
  adjust: 'Host adjustment',
  mission: 'Mission completed',
  shootout: 'Penalty kick',
  tiebreak: 'Won tie-break',
};

export function describeEvent(event: ScoreEvent): string {
  if (event.kind === 'shootout') return event.scored ? 'Penalty kick scored' : 'Penalty kick missed';
  return KIND_LABEL[event.kind];
}

export function formatPoints(points: number): string {
  if (points > 0) return `+${points}`;
  if (points < 0) return `−${Math.abs(points)}`;
  return '0';
}

interface EventLogProps {
  session: GameSession;
  onReverse?: (eventId: string) => void;
  limit?: number;
  title?: string;
}

export function EventLog({ session, onReverse, limit = 8, title = 'Score history' }: EventLogProps) {
  const confirm = useConfirm();
  const events = [...session.events].reverse().slice(0, limit);
  const nameOf = (id: string | null) => session.participants.find((p) => p.id === id)?.name ?? 'No team';
  const unit = session.gameId === 'football' ? 'goal' : 'point';

  const reverse = async (event: ScoreEvent) => {
    if (!onReverse) return;
    const ok = await confirm({
      title: `Undo this ${describeEvent(event).toLowerCase()}?`,
      message: `${nameOf(event.participantId)} · ${describeEvent(event)}${event.points ? ` (${formatPoints(event.points)} ${unit}${Math.abs(event.points) === 1 ? '' : 's'})` : ''}. The score will update straight away and the entry stays in the history marked as undone.`,
      confirmLabel: 'Undo entry',
      tone: 'danger',
    });
    if (ok) onReverse(event.id);
  };

  return (
    <section className="panel event-log" aria-labelledby="event-log-title">
      <div className="panel-head">
        <h2 id="event-log-title" className="panel-title">
          {title}
        </h2>
        <span className="panel-meta">{session.events.length} entries</span>
      </div>
      {events.length === 0 ? (
        <p className="muted small">Nothing recorded yet. Every point, goal and skip the host confirms appears here.</p>
      ) : (
        <ol className="event-list">
          {events.map((event) => (
            <li key={event.id} className={`event-row ${event.reversed ? 'is-reversed' : ''}`}>
              <span className={`event-points ${event.points > 0 ? 'is-plus' : event.points < 0 ? 'is-minus' : ''}`}>{formatPoints(event.points)}</span>
              <span className="event-text">
                <span className="event-main">
                  {nameOf(event.participantId)} · {describeEvent(event)}
                  {event.reversed && <span className="tag">Undone</span>}
                </span>
                <span className="event-sub">
                  {session.gameId === 'football' ? 'Period' : 'Round'} {event.round}
                  {event.contentTitle ? ` · ${event.contentTitle}` : ''}
                  {event.note ? ` · ${event.note}` : ''}
                </span>
              </span>
              {onReverse && !event.reversed && event.kind !== 'tiebreak' && (
                <button type="button" className="icon-btn icon-btn-sm" onClick={() => void reverse(event)} aria-label={`Undo: ${nameOf(event.participantId)} ${describeEvent(event)}`}>
                  <Undo2 size={14} />
                </button>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
