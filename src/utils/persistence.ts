export const STORAGE_KEYS = {
  roster: 'fagd.roster.v1',
  draft: 'fagd.draft.v1',
  session: 'fagd.activeSession.v1',
  history: 'fagd.history.v1',
  settings: 'fagd.settings.v1',
} as const;

/** Reads and validates a stored value. Missing, unparsable or invalid data falls back safely. */
export function readStored<T>(key: string, validate: (value: unknown) => value is T, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return validate(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function writeStored(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeStored(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage unavailable (e.g. private mode); nothing to remove.
  }
}
