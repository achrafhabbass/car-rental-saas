'use client';

import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { cn } from './utils';

type Tone = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  tone: Tone;
  title: string;
  message?: string;
}

interface ToastApi {
  show: (input: { tone?: Tone; title: string; message?: string; durationMs?: number }) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback<ToastApi['show']>((input) => {
    const id = ++seq.current;
    const tone = input.tone ?? 'info';
    setToasts((prev) => [...prev, { id, tone, title: input.title, message: input.message }]);
    const duration = input.durationMs ?? (tone === 'error' ? 6000 : 3500);
    setTimeout(() => remove(id), duration);
  }, [remove]);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (title, message) => show({ tone: 'success', title, message }),
      error: (title, message) => show({ tone: 'error', title, message }),
      info: (title, message) => show({ tone: 'info', title, message }),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const palette: Record<Tone, { bg: string; border: string; icon: ReactNode }> = {
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: <XCircle className="h-5 w-5 text-red-600" />,
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: <Info className="h-5 w-5 text-blue-600" />,
    },
  };
  const p = palette[toast.tone];
  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-3 rounded-lg border px-4 py-3 shadow-sm',
        p.bg,
        p.border,
      )}
    >
      <div className="mt-0.5 shrink-0">{p.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-slate-700 mt-0.5">{toast.message}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-slate-400 hover:text-slate-700 shrink-0"
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
