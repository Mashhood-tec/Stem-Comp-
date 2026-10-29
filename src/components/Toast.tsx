import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

type Tone = 'success' | 'info' | 'error';

interface ToastItem {
  id: number;
  message: string;
  tone: Tone;
}

interface ToastApi {
  success: (message: string) => void;
  info: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);
const DISMISS_MS = 4000;
const ICONS = { success: CircleCheck, info: Info, error: CircleAlert };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const push = useCallback(
    (tone: Tone, message: string) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-2), { id, tone, message }]);
      timers.current.set(id, window.setTimeout(() => dismiss(id), DISMISS_MS));
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push('success', m),
      info: (m) => push('info', m),
      error: (m) => push('error', m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.tone];
          return (
            <div key={toast.id} className={`toast toast-${toast.tone}`}>
              <Icon size={18} aria-hidden="true" />
              <span>{toast.message}</span>
              <button type="button" className="icon-btn icon-btn-sm" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
