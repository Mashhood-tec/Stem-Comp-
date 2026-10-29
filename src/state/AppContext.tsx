import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isGameId } from '../games/definitions';
import { useGameSession, type GameSessionApi } from '../hooks/useGameSession';
import { useHashRoute, type Route } from '../hooks/useHashRoute';
import { loadValidated, useLocalStorage } from '../hooks/useLocalStorage';
import { UNKNOWN_AI_STATUS, fetchAiStatus, type AiStatus } from '../services/aiContentService';
import type { GameId, PlayMode } from '../types/game';
import type { HistoryRecord, Player, Roster, Team } from '../types/session';
import { STORAGE_KEYS, readStored } from '../utils/persistence';
import { isHistoryRecord, isPlayer, isRoster, isTeam } from '../utils/validation';

export interface AppSettings {
  sound: boolean;
}

export interface Draft {
  gameId: GameId;
  mode: PlayMode;
  players: Player[];
  teams: Team[];
}

export const DEFAULT_ROSTER: Roster = {
  teams: [
    { id: 'team-a', name: 'Team A' },
    { id: 'team-b', name: 'Team B' },
  ],
  players: [
    { id: 'p1', name: 'P1', teamId: 'team-a' },
    { id: 'p2', name: 'P2', teamId: 'team-a' },
    { id: 'p3', name: 'P3', teamId: 'team-b' },
    { id: 'p4', name: 'P4', teamId: 'team-b' },
  ],
};

const MAX_HISTORY = 50;

function isDraft(value: unknown): value is Draft {
  if (typeof value !== 'object' || value === null) return false;
  const d = value as Record<string, unknown>;
  return (
    isGameId(d.gameId) &&
    (d.mode === 'team' || d.mode === 'individual') &&
    Array.isArray(d.players) &&
    d.players.every(isPlayer) &&
    Array.isArray(d.teams) &&
    d.teams.every(isTeam)
  );
}

function isSettings(value: unknown): value is AppSettings {
  return typeof value === 'object' && value !== null && typeof (value as AppSettings).sound === 'boolean';
}

/** Loads history, keeping valid records and silently dropping corrupted ones. */
function loadHistory(): HistoryRecord[] {
  const raw = readStored<unknown[]>(STORAGE_KEYS.history, (v): v is unknown[] => Array.isArray(v), []);
  return raw.filter(isHistoryRecord).slice(0, MAX_HISTORY);
}

interface AppContextValue {
  route: Route;
  navigate: (to: string, options?: { replace?: boolean }) => void;
  roster: Roster;
  setRoster: (roster: Roster) => void;
  draft: Draft | null;
  setDraft: (draft: Draft | null) => void;
  game: GameSessionApi;
  history: HistoryRecord[];
  addHistory: (record: HistoryRecord) => void;
  clearHistory: () => void;
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
  aiStatus: AiStatus;
  refreshAiStatus: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [route, navigate] = useHashRoute();
  const [roster, setRoster] = useLocalStorage<Roster>(STORAGE_KEYS.roster, loadValidated(STORAGE_KEYS.roster, isRoster, DEFAULT_ROSTER));
  const [draft, setDraft] = useLocalStorage<Draft | null>(
    STORAGE_KEYS.draft,
    loadValidated<Draft | null>(STORAGE_KEYS.draft, (v): v is Draft | null => isDraft(v), null),
    { removeWhen: (value) => value === null },
  );
  const [history, setHistory] = useLocalStorage<HistoryRecord[]>(STORAGE_KEYS.history, loadHistory);
  const [settings, setSettings] = useLocalStorage<AppSettings>(STORAGE_KEYS.settings, loadValidated(STORAGE_KEYS.settings, isSettings, { sound: true }));
  const game = useGameSession();
  const [aiStatus, setAiStatus] = useState<AiStatus>(UNKNOWN_AI_STATUS);

  const refreshAiStatus = useCallback(() => {
    void fetchAiStatus().then(setAiStatus);
  }, []);
  useEffect(refreshAiStatus, [refreshAiStatus]);

  const addHistory = useCallback(
    (record: HistoryRecord) => {
      setHistory((previous) => (previous.some((r) => r.id === record.id) ? previous : [record, ...previous].slice(0, MAX_HISTORY)));
    },
    [setHistory],
  );
  const clearHistory = useCallback(() => setHistory([]), [setHistory]);

  const value = useMemo<AppContextValue>(
    () => ({
      route,
      navigate,
      roster,
      setRoster,
      draft,
      setDraft,
      game,
      history,
      addHistory,
      clearHistory,
      settings,
      setSettings,
      aiStatus,
      refreshAiStatus,
    }),
    [route, navigate, roster, setRoster, draft, setDraft, game, history, addHistory, clearHistory, settings, setSettings, aiStatus, refreshAiStatus],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
