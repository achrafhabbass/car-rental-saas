'use client';

import { Eraser, Loader2, X } from 'lucide-react';
import SignaturePadLib from 'signature_pad';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ApiError, uploadFile } from '@/lib/api';
import type { UploadResponseDto } from '@autosphere/shared';

interface SignatureModalProps {
  open: boolean;
  onClose: () => void;
  /** Called after the signature is uploaded — receives the public URL. */
  onSigned: (url: string) => Promise<void> | void;
  title?: string;
}

/**
 * Modal with a canvas-based signature pad. Captures the user's drawn
 * signature, exports it as a PNG, uploads it via /uploads (kind=signature),
 * and hands the resulting URL back to the parent.
 *
 * The canvas is re-sized to its container's pixel dimensions on mount and
 * on window resize. signature_pad's `fromData` is used after resize so a
 * mid-drawing resize doesn't wipe the stroke history.
 */
export function SignatureModal({
  open,
  onClose,
  onSigned,
  title = 'Signature du client',
}: SignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<SignaturePadLib | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    function resize(): void {
      const c = canvasRef.current;
      if (!c) return;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const data = padRef.current?.toData() ?? [];
      c.width = c.offsetWidth * ratio;
      c.height = c.offsetHeight * ratio;
      c.getContext('2d')?.scale(ratio, ratio);
      if (padRef.current) {
        padRef.current.clear();
        if (data.length) padRef.current.fromData(data);
      }
    }

    padRef.current = new SignaturePadLib(canvas, {
      backgroundColor: '#ffffff',
      penColor: '#0f172a',
    });
    resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      padRef.current?.off();
      padRef.current = null;
    };
  }, [open]);

  if (!open) return null;

  function clear(): void {
    padRef.current?.clear();
    setError(null);
  }

  async function save(): Promise<void> {
    if (!padRef.current || padRef.current.isEmpty()) {
      setError('Veuillez signer avant de continuer.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const dataUrl = padRef.current.toDataURL('image/png');
      // Convert data URL → Blob → File so the multipart upload picks the
      // right MIME and filename.
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `signature-${Date.now()}.png`, {
        type: 'image/png',
      });
      const result = await uploadFile<UploadResponseDto>(file, {
        kind: 'signature',
      });
      await onSigned(result.url);
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Échec de l\'envoi',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Fermer"
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-2 text-xs text-slate-500">
          Faites signer le client dans le cadre ci-dessous.
        </p>

        <div className="overflow-hidden rounded-xl border-2 border-slate-200 bg-white">
          <canvas
            ref={canvasRef}
            className="block h-48 w-full touch-none"
            aria-label="Zone de signature"
          />
        </div>

        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

        <div className="mt-4 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={clear}
            disabled={saving}
          >
            <Eraser className="mr-1.5 h-4 w-4" />
            Effacer
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
              Annuler
            </Button>
            <Button type="button" onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Enregistrer la signature
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
