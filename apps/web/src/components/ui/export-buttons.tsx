'use client';

import { FileDown, FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';

import { downloadFile } from '@/lib/api';
import { Button } from './button';

interface ExportButtonsProps {
  /** API path without /api/v1 prefix, e.g. '/vehicles/export' */
  basePath: string;
  label?: string;
}

export function ExportButtons({ basePath, label = 'Exporter' }: ExportButtonsProps) {
  const [busy, setBusy] = useState<'xlsx' | 'pdf' | null>(null);

  async function doExport(format: 'xlsx' | 'pdf') {
    setBusy(format);
    try {
      const filename = basePath.split('/')[1] ?? 'export';
      await downloadFile(
        `${basePath}?format=${format}`,
        `${filename}.${format}`,
      );
    } catch {
      // downloadFile shows errors internally or throws silently
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => doExport('xlsx')}
        loading={busy === 'xlsx'}
        disabled={busy !== null}
      >
        <FileSpreadsheet className="h-4 w-4" />
        {label} Excel
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => doExport('pdf')}
        loading={busy === 'pdf'}
        disabled={busy !== null}
      >
        <FileDown className="h-4 w-4" />
        {label} PDF
      </Button>
    </div>
  );
}
