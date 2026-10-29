import { AlertTriangle, HelpCircle } from 'lucide-react';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Modal } from './Modal';

export interface ConfirmOptions {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'default';
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((next) => {
    resolver.current?.(false);
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setOptions(null);
  };

  const danger = options?.tone === 'danger';
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal open={options !== null} onClose={() => close(false)} labelledBy="confirm-title" describedBy="confirm-message" role="alertdialog" className="confirm-dialog">
        {options && (
          <>
            <div className={`confirm-icon ${danger ? 'is-danger' : ''}`} aria-hidden="true">
              {danger ? <AlertTriangle size={22} /> : <HelpCircle size={22} />}
            </div>
            <h2 id="confirm-title" className="modal-title">
              {options.title}
            </h2>
            <div id="confirm-message" className="modal-text">
              {options.message}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => close(false)} data-autofocus>
                {options.cancelLabel ?? 'Cancel'}
              </button>
              <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => close(true)}>
                {options.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used inside ConfirmProvider');
  return context;
}
