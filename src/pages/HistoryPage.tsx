import { ArrowRight, History, Trash2 } from 'lucide-react';
import { useConfirm } from '../components/ConfirmationDialog';
import { EmptyState } from '../components/EmptyState';
import { GameIconTile } from '../components/GameCard';
import { getGame } from '../games/definitions';
import { useApp } from '../state/AppContext';
import type { HistoryRecord } from '../types/session';
import { formatDateTime } from '../utils/format';
import { rankStandings } from '../utils/scoring';

function outcomeText(record: HistoryRecord): string {
  const nameOf = (id: string) => record.participants.find((p) => p.id === id)?.name ?? '';
  return record.outcome.type === 'win' ? `${record.outcome.winnerIds.map(nameOf).join(' & ')} won` : `Tie: ${record.outcome.participantIds.map(nameOf).join(' & ')}`;
}

function scoreText(record: HistoryRecord): string {
  return rankStandings(record.standings)
    .slice(0, 4)
    .map((s) => `${s.name} ${s.score}`)
    .join(' · ');
}

export function HistoryPage() {
  const { history, clearHistory, navigate } = useApp();
  const confirm = useConfirm();

  const clear = async () => {
    const ok = await confirm({ title: 'Clear all game history?', message: 'Every saved result on this device will be deleted.', confirmLabel: 'Clear history', tone: 'danger' });
    if (ok) clearHistory();
  };

  return (
    <div className="page container">
      <header className="page-head row">
        <div>
          <p className="eyebrow">Saved on this device</p>
          <h1 className="page-title">Session history</h1>
        </div>
        {history.length > 0 && (
          <button type="button" className="btn btn-danger-ghost btn-sm" onClick={() => void clear()}>
            <Trash2 size={15} aria-hidden="true" /> Clear history
          </button>
        )}
      </header>

      {history.length === 0 ? (
        <EmptyState
          icon={History}
          title="No games played yet"
          actions={
            <button type="button" className="btn btn-primary" onClick={() => navigate('/games')}>
              Start Your First Game
            </button>
          }
        >
          <p>Finished games are saved here with scores, winners and round-by-round results.</p>
        </EmptyState>
      ) : (
        <ul className="history-list">
          {history.map((record) => {
            const game = getGame(record.gameId);
            return (
              <li key={record.id}>
                <a href={`#/history/${record.id}`} className="history-item">
                  {game && <GameIconTile game={game} size="sm" />}
                  <span className="history-text">
                    <span className="history-title">{record.gameName}</span>
                    <span className="history-meta">{formatDateTime(record.finishedAt)}</span>
                  </span>
                  <span className="history-result">
                    <span className="history-outcome">{outcomeText(record)}</span>
                    <span className="history-meta">{scoreText(record)}</span>
                  </span>
                  <ArrowRight size={18} aria-hidden="true" className="history-arrow" />
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
