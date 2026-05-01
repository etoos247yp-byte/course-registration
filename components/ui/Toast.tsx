'use client';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { colors } from '@/lib/design-tokens';

type ToastVariant = 'success' | 'error' | 'info';
type ToastEntry = { id: number; variant: ToastVariant; message: string };

const ToastContext = createContext<{
  toast: (message: string, variant?: ToastVariant) => void;
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const toast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, variant, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-start gap-2 max-w-sm bg-white border rounded-md shadow-lg px-4 py-3"
            style={{ borderColor: colors.border }}
          >
            {t.variant === 'success' && (
              <CheckCircle2 size={16} className="mt-0.5" style={{ color: colors.primary }} />
            )}
            {t.variant === 'error' && (
              <AlertCircle size={16} className="mt-0.5" style={{ color: colors.danger }} />
            )}
            {t.variant === 'info' && (
              <Info size={16} className="mt-0.5" style={{ color: colors.textMuted }} />
            )}
            <p className="text-sm text-gray-800 flex-1">{t.message}</p>
            <button
              onClick={() => setToasts((s) => s.filter((x) => x.id !== t.id))}
              className="text-gray-400 hover:text-gray-700"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx.toast;
}
