export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} sec`;
  const minutes = seconds / 60;
  return Number.isInteger(minutes) ? `${minutes} min` : `${Math.floor(minutes)} min ${seconds % 60} sec`;
}

export function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

export function formatElapsed(fromMs: number, toMs: number): string {
  const minutes = Math.max(1, Math.round((toMs - fromMs) / 60000));
  return `${minutes} min`;
}

export function ordinal(n: number): string {
  const suffix = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
}

export function plural(count: number, word: string, pluralWord = `${word}s`): string {
  return `${count} ${count === 1 ? word : pluralWord}`;
}
