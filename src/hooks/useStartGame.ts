import { useCallback } from 'react';
import { useConfirm } from '../components/ConfirmationDialog';
import { createSession, type NewSessionConfig } from '../engine/session';
import { getGame } from '../games/definitions';
import { pickPrepared } from '../services/gameContentService';
import { useApp } from '../state/AppContext';

/** Creates a fresh session (scores always start at zero) and opens the game screen. */
export function useStartGame() {
  const { game, navigate } = useApp();
  const confirm = useConfirm();

  return useCallback(
    async (config: NewSessionConfig): Promise<boolean> => {
      const current = game.session;
      if (current && current.status !== 'finished') {
        const currentName = getGame(current.gameId)?.name ?? 'another game';
        const ok = await confirm({
          title: 'Replace the game in progress?',
          message: `${currentName} is still in progress. Starting a new game ends it without saving a result.`,
          confirmLabel: 'Start new game',
          tone: 'danger',
        });
        if (!ok) return false;
      }
      game.start(createSession(config, pickPrepared(config.gameId, [])));
      navigate('/play');
      return true;
    },
    [game, navigate, confirm],
  );
}
