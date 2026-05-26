'use client';

import { ImagePlus, Loader2, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { ApiError, uploadFile } from '@/lib/api';
import type { UploadKind, UploadResponseDto } from '@autosphere/shared';

interface ImageUploaderProps {
  /** Current photo URLs (controlled). */
  value: string[];
  /** Called with the next list after add/remove. */
  onChange: (next: string[]) => void;
  /** Logical category — controls the storage folder. */
  kind: UploadKind;
  /** Max images allowed (default: 8). */
  max?: number;
  /** Accept attribute on the file input. */
  accept?: string;
  /** Label shown above the gallery. */
  label?: string;
  /** Read-only mode (no add/remove). */
  disabled?: boolean;
}

/**
 * Multi-image uploader. Hits POST /uploads for each file picked, then
 * appends the returned URL to `value`. Errors are surfaced inline.
 *
 * Used for vehicle photos, inspection damage photos, and the tenant logo
 * (with `max={1}` for the latter).
 */
export function ImageUploader({
  value,
  onChange,
  kind,
  max = 8,
  accept = 'image/jpeg,image/png,image/webp,image/gif',
  label,
  disabled,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAddMore = value.length < max;

  async function handleFiles(files: FileList | null): Promise<void> {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const remaining = max - value.length;
      const picked = Array.from(files).slice(0, remaining);
      const urls: string[] = [];
      for (const file of picked) {
        const res = await uploadFile<UploadResponseDto>(file, { kind });
        urls.push(res.url);
      }
      onChange([...value, ...urls]);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || `Erreur ${err.status}`);
      } else {
        setError((err as Error).message);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function remove(url: string): void {
    onChange(value.filter((u) => u !== url));
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-700">{label}</label>
      )}
      <div className="flex flex-wrap gap-3">
        {value.map((url) => (
          <div
            key={url}
            className="relative h-24 w-24 overflow-hidden rounded-lg ring-1 ring-slate-200"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            {!disabled && (
              <button
                type="button"
                onClick={() => remove(url)}
                className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                aria-label="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        {!disabled && canAddMore && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-primary-400 hover:text-primary-600 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ImagePlus className="h-5 w-5" />
            )}
            <span className="text-[11px]">Ajouter</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={max > 1}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-xs text-slate-400">
        {value.length}/{max} {max === 1 ? 'fichier' : 'fichiers'}
      </p>
    </div>
  );
}
