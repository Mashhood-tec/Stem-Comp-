import { Crown, Gamepad2, History, House, RotateCcw, Scale, SearchX } from 'lucide-react';
import { describeEvent, formatPoints } from '../components/EventLog';
import { EmptyState } from '../components/EmptyState';
import { GameIconTile } from '../components/GameCard';
import { getGame } from '../games/definitions';
import { useStartGame } from '../hooks/useStartGame';
import { useApp } from '../state/AppContext';
import type { HistoryRecord } from '../types/session';
import { formatDateTime, formatDuration, formatElapsed, plural } from '../utils/format';
import { describeDecidedBy, rankStandings } from '../utils/scoring';

export function ResultsPage({ recordId, fromHistory }: { recordId: string | undefined; fromHistory: boolean }) {
  const { history } = useApp();
  const record = history.find((r) => r.id === recordId);
  if (!record) {
    return (
      <div className="page container">
        <EmptyState icon={SearchX} title="Result not found" actions={<a href="#/history" className="btn btn-primary">Open history</a>}>
          <p>This game result isn't saved on this device. It may have been cleared.</p>
        </EmptyState>
      </div>
    );
  }
  return <ResultsView record={record} celebrate={!fromHistory} />;
}

const CONFETTI = Array.from({ length: 18 }, (_, i) => i);

function ResultsView({ record, celebrate }: { record: HistoryRecord; celebrate: boolean }) {
  const { navigate } = useApp();
  const startGame = useStartGame();
  const game = getGame(record.gameId);
  const ranked = rankStandings(record.standings);
  const nameOf = (id: string) => record.participants.find((p) => p.id === id)?.name ?? '';
  const isFootball = record.gameId === 'football';
  const unit = isFootball ? 'goals' : 'points';
  const roundLabel = game?.roundLabel ?? 'Round';
  const { outcome, stats } = record;
  const pair = record.participants.length === 2 ? record.participants.map((p) => record.standings.find((s) => s.participantId === p.id)!) : null;
  const headline = outcome.type === 'win' ? `${outcome.winnerIds.map(nameOf).join(' & ')} wins!` : "It's a tie!";

  const playAgain = () =>
    void startGame({
      gameId: record.gameId,
      mode: record.mode,
      players: record.players,
      teams: record.teams,
      turnSeconds: record.settings.turnSeconds,
      totalRounds: record.settings.totalRounds,
    });

  const statItems: [string, number][] = isFootball
    ? [
        ['Goals', stats.goals],
        ['Missions completed', stats.missionsCompleted],
        ['Missions skipped', stats.skipped],
      ]
    : [
        ['Challenges completed', stats.challengesCompleted],
        ['Correct', stats.correct],
        ['Incorrect', stats.incorrect],
        ['Skipped / passed', stats.skipped],
        ['No answer', stats.unanswered],
        ['Penalties', stats.penalties],
      ];

  return (
    <div className="page container results-page">
      {celebrate && outcome.type === 'win' && (
        <div className="confetti" aria-hidden="true">
          {CONFETTI.map((i) => (
            <span key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 6) * 0.18}s` }} />
          ))}
        </div>
      )}

      <header className="results-hero">
        {game && <GameIconTile game={game} size="lg" />}
        <p className="eyebrow">Step 6 · Final results · {record.gameName}</p>
        <h1 className="display-sm">
          {outcome.type === 'win' ? <Crown size={34} aria-hidden="true" className="crown" /> : <Scale size={34} aria-hidden="true" className="crown" />}
          {headline}
        </h1>
        <p className="muted">{describeDecidedBy(outcome)}</p>

        {pair ? (
          <div className="final-score is-big" aria-label={`${pair[0].name} ${pair[0].score}, ${pair[1].name} ${pair[1].score}`}>
            <span className="final-name">{pair[0].name}</span>
            <span className="final-digits">
              {pair[0].score}
              <span className="final-sep">–</span>
              {pair[1].score}
            </span>
            <span className="final-name">{pair[1].name}</span>
          </div>
        ) : (
          <ol className="rank-list is-big">
            {ranked.map((s, i) => (
              <li key={s.participantId} className={outcome.type === 'win' && outcome.winnerIds.includes(s.participantId) ? 'is-winner' : ''}>
                <span className="rank-pos">{i + 1}</span>
                <span className="rank-name">{s.name}</span>
                <span className="rank-score">
                  {s.score} {unit}
                </span>
              </li>
            ))}
          </ol>
        )}

        <div className="btn-row center">
          <button type="button" className="btn btn-primary btn-lg" onClick={playAgain}>
            <RotateCcw size={18} aria-hidden="true" /> Play Again
          </button>
          <button type="button" className="btn btn-secondary btn-lg" onClick={() => navigate('/games')}>
            <Gamepad2 size={18} aria-hidden="true" /> Choose Another Game
          </button>
        </div>
        <div className="btn-row center tight">
          <a href="#/" className="btn btn-ghost btn-sm">
            <House size={15} aria-hidden="true" /> Home
          </a>
          <a href="#/history" className="btn btn-ghost btn-sm">
            <History size={15} aria-hidden="true" /> Session history
          </a>
        </div>
      </header>

      <div className="results-grid">
        <section className="panel" aria-labelledby="rounds-title">
          <h2 id="rounds-title" className="panel-title">
            {roundLabel}-by-{roundLabel.toLowerCase()} scores
          </h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">{roundLabel}</th>
                  {record.participants.map((p) => (
                    <th key={p.id} scope="col">
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {record.roundScores.map((r) => (
                  <tr key={r.round}>
                    <th scope="row">
                      {roundLabel} {r.round}
                    </th>
                    {record.participants.map((p) => (
                      <td key={p.id}>{r.scores[p.id] ?? 0}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Total</th>
                  {record.participants.map((p) => (
                    <td key={p.id}>
                      <strong>{record.standings.find((s) => s.participantId === p.id)?.score ?? 0}</strong>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <section className="panel" aria-labelledby="stats-title">
          <h2 id="stats-title" className="panel-title">
            Session summary
          </h2>
          <dl className="stat-grid">
            {statItems.map(([label, value]) => (
              <div key={label} className="stat">
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="muted small">
            {plural(record.players.length, 'player')}
            {record.mode === 'team' ? ` in ${plural(record.teams.length, 'team')}` : ' playing individually'} · {record.settings.totalRounds}{' '}
            {(record.settings.totalRounds === 1 ? (game?.roundLabel ?? 'round') : (game?.roundsLabel ?? 'rounds')).toLowerCase()} ·{' '}
            {formatDuration(record.settings.turnSeconds)} {(game?.timeLabel ?? 'turns').toLowerCase()} · played {formatDateTime(record.finishedAt)} ({formatElapsed(record.startedAt, record.finishedAt)})
          </p>
          <p className="muted small">
            AI content used: {plural(stats.preparedItems, 'prepared AI-created item')}
            {stats.liveAiItems > 0 ? ` and ${plural(stats.liveAiItems, 'live AI-generated item')}` : ''}.
          </p>
          {record.mode === 'team' && (
            <ul className="team-summary">
              {record.participants.map((p) => (
                <li key={p.id}>
                  <strong>{p.name}:</strong> {p.memberIds.map((id) => record.players.find((pl) => pl.id === id)?.name).join(', ')}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <details className="panel timeline">
        <summary className="panel-title">Full score history ({record.events.length} entries)</summary>
        <ol className="event-list">
          {record.events.map((e) => (
            <li key={e.id} className={`event-row ${e.reversed ? 'is-reversed' : ''}`}>
              <span className={`event-points ${e.points > 0 ? 'is-plus' : e.points < 0 ? 'is-minus' : ''}`}>{formatPoints(e.points)}</span>
              <span className="event-text">
                <span className="event-main">
                  {nameOf(e.participantId ?? '') || 'No team'} · {describeEvent(e)}
                  {e.reversed && <span className="tag">Undone</span>}
                </span>
                <span className="event-sub">
                  {e.turnKey === 'tiebreak' ? 'Tie-break' : `${roundLabel} ${e.round}`}
                  {e.contentTitle ? ` · ${e.contentTitle}` : ''}
                  {e.note ? ` · ${e.note}` : ''}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}
