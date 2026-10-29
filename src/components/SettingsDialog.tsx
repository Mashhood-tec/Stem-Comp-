import { RotateCcw, Trash2, Volume2, VolumeX, WandSparkles, X } from 'lucide-react';
import { DEFAULT_ROSTER, useApp } from '../state/AppContext';
import { useConfirm } from './ConfirmationDialog';
import { Modal } from './Modal';
import { useToast } from './Toast';

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, setSettings, aiStatus, refreshAiStatus, history, clearHistory, setRoster } = useApp();
  const confirm = useConfirm();
  const toast = useToast();

  const resetPlayers = async () => {
    const ok = await confirm({
      title: 'Reset players and teams?',
      message: 'This restores the example lineup: Team A (P1, P2) and Team B (P3, P4).',
      confirmLabel: 'Reset players',
    });
    if (ok) {
      setRoster(DEFAULT_ROSTER);
      toast.success('Players reset to the example lineup.');
    }
  };

  const wipeHistory = async () => {
    const ok = await confirm({
      title: 'Clear all game history?',
      message: `This permanently deletes ${history.length} saved game${history.length === 1 ? '' : 's'} from this device.`,
      confirmLabel: 'Clear history',
      tone: 'danger',
    });
    if (ok) {
      clearHistory();
      toast.success('Game history cleared.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="settings-title" className="settings-dialog">
      <div className="modal-header">
        <h2 id="settings-title" className="modal-title">
          Settings
        </h2>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close settings">
          <X size={18} />
        </button>
      </div>

      <div className="settings-list">
        <div className="settings-row">
          <div>
            <p className="settings-label">Time-up sound</p>
            <p className="settings-help">Play a short alert when a countdown reaches zero.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.sound}
            className={`switch ${settings.sound ? 'is-on' : ''}`}
            onClick={() => setSettings({ ...settings, sound: !settings.sound })}
          >
            {settings.sound ? <Volume2 size={15} aria-hidden="true" /> : <VolumeX size={15} aria-hidden="true" />}
            <span>{settings.sound ? 'On' : 'Off'}</span>
          </button>
        </div>

        <div className="settings-row">
          <div>
            <p className="settings-label">
              <WandSparkles size={15} aria-hidden="true" /> Live AI generation
            </p>
            <p className="settings-help">
              {!aiStatus.checked
                ? 'Checking for a live AI connection…'
                : aiStatus.configured
                  ? `Connected through the secure server endpoint${aiStatus.model ? ` (${aiStatus.model})` : ''}. "Generate New Challenge" creates fresh content on demand.`
                  : 'Not configured. All games use the prepared AI-created content set. To enable live generation, add OPENAI_API_KEY to the project .env file and restart the server.'}
            </p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={refreshAiStatus}>
            Check again
          </button>
        </div>

        <div className="settings-row">
          <div>
            <p className="settings-label">Players and teams</p>
            <p className="settings-help">Restore the default P1–P4 example lineup.</p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={resetPlayers}>
            <RotateCcw size={15} aria-hidden="true" /> Reset
          </button>
        </div>

        <div className="settings-row">
          <div>
            <p className="settings-label">Game history</p>
            <p className="settings-help">{history.length ? `${history.length} saved on this device.` : 'No saved games yet.'}</p>
          </div>
          <button type="button" className="btn btn-danger-ghost btn-sm" onClick={wipeHistory} disabled={history.length === 0}>
            <Trash2 size={15} aria-hidden="true" /> Clear
          </button>
        </div>
      </div>
    </Modal>
  );
}
