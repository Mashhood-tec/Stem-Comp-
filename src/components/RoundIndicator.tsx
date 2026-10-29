interface RoundIndicatorProps {
  round: number;
  totalRounds: number;
  label: string;
  turn?: number;
  totalTurns?: number;
}

export function RoundIndicator({ round, totalRounds, label, turn, totalTurns }: RoundIndicatorProps) {
  return (
    <div className="round-indicator">
      <span className="round-text">
        {label} <strong>{round}</strong> of {totalRounds}
        {turn !== undefined && totalTurns !== undefined && (
          <>
            <span className="dot-sep" aria-hidden="true">·</span>
            Turn <strong>{turn}</strong> of {totalTurns}
          </>
        )}
      </span>
      <span className="round-dots" aria-hidden="true">
        {Array.from({ length: totalRounds }, (_, i) => (
          <span key={i} className={`round-dot ${i + 1 < round ? 'is-done' : ''} ${i + 1 === round ? 'is-current' : ''}`} />
        ))}
      </span>
    </div>
  );
}
