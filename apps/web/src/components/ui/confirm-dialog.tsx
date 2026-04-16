'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { Button } from './button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal confirmation. Renders nothing when closed; lock body scroll when open;
 * closes on Escape.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  tone = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancel();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="p-5 flex items-start gap-4">
          <div
            className={cn(
              'p-2 rounded-lg shrink-0',
              tone === 'danger' ? 'bg-red-100 text-red-600' : 'bg-primary-100 text-primary-600',
            )}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            {description && (
              <div className="mt-2 text-sm text-slate-600">{description}</div>
            )}
          </div>
        </div>
        <div className="border-t border-slate-200 px-5 py-3 flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
