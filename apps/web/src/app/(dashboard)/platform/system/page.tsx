'use client';

import {
  CheckCircle2,
  Clock,
  Database,
  FileArchive,
  HardDrive,
  Play,
  RefreshCw,
  ScrollText,
  Shield,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PageHeader } from '@/components/ui/page-header';
import { Badge, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { systemApi } from '@/lib/resources';
import { useToast } from '@/lib/toast-context';

function fmt(n: number): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
}

function fmtSize(kb: number): string {
  if (kb < 1024) return `${fmt(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const CAT_ICON: Record<string, typeof Database> = {
  database: Database,
  files: FileArchive,
  logs: ScrollText,
};

const CAT_LABEL: Record<string, string> = {
  database: 'Base de données',
  files: 'Fichiers',
  logs: 'Logs',
};

type Summary = {
  lastBackupAt: string | null;
  lastStatus: 'SUCCESS' | 'FAILED' | null;
  totalSizeKb: number;
  totalCount: number;
  byCategory: Record<string, number>;
  retentionDays: number;
};

type BackupFile = {
  filename: string;
  category: string;
  sizeKb: number;
  sha256: string;
  status: string;
  createdAt: string;
};

export default function SystemBackupsPage() {
  const { hasRole } = useAuth();
  const toast = useToast();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [files, setFiles] = useState<BackupFile[]>([]);
  const [logText, setLogText] = useState('');
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [restoreFile, setRestoreFile] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [s, f, l] = await Promise.all([
        systemApi.backupSummary(),
        systemApi.backupList(),
        systemApi.backupLog(),
      ]);
      setSummary(s);
      setFiles(f);
      setLogText(l.log);
    } catch (err) {
      if (err instanceof ApiError) toast.error('Erreur', err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (hasRole('SUPER_ADMIN')) void load();
  }, [hasRole]);

  async function runFullBackup() {
    setRunning(true);
    try {
      await systemApi.runFullBackup();
      toast.success('Backup complet terminé', 'Base de données + fichiers + logs');
      void load();
    } catch (err) {
      toast.error('Backup échoué', err instanceof ApiError ? err.message : 'Erreur');
    } finally {
      setRunning(false);
    }
  }

  async function runCategory(cat: string) {
    setRunning(true);
    try {
      await systemApi.runCategoryBackup(cat);
      toast.success(`Backup ${CAT_LABEL[cat] ?? cat} terminé`);
      void load();
    } catch (err) {
      toast.error('Backup échoué', err instanceof ApiError ? err.message : 'Erreur');
    } finally {
      setRunning(false);
    }
  }

  async function doRestore() {
    if (!restoreFile) return;
    setRestoring(true);
    try {
      const res = await systemApi.restoreDatabase(restoreFile);
      toast.success('Restauration réussie', res.message);
      setRestoreFile(null);
    } catch (err) {
      toast.error('Restauration échouée', err instanceof ApiError ? err.message : 'Erreur');
    } finally {
      setRestoring(false);
    }
  }

  if (!hasRole('SUPER_ADMIN')) {
    return (
      <Card>
        <CardBody className="text-center py-12 text-sm text-slate-500">
          Section réservée aux super-administrateurs.
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-container">
      <PageHeader
        title="Système — Sauvegardes"
        description="Gestion des sauvegardes automatiques de la plateforme."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => void load()} loading={loading}>
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </Button>
            <Button onClick={runFullBackup} loading={running}>
              <Play className="h-4 w-4" />
              Lancer un backup complet
            </Button>
          </div>
        }
      />

      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardBody className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary-50">
                <Clock className="h-4 w-4 text-primary-500" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Dernier backup
                </p>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {formatDate(summary.lastBackupAt)}
                </p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${summary.lastStatus === 'SUCCESS' ? 'bg-emerald-50' : summary.lastStatus === 'FAILED' ? 'bg-red-50' : 'bg-slate-50'}`}>
                {summary.lastStatus === 'SUCCESS' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : summary.lastStatus === 'FAILED' ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <Shield className="h-4 w-4 text-slate-400" />
                )}
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Statut
                </p>
                <Badge tone={summary.lastStatus === 'SUCCESS' ? 'green' : summary.lastStatus === 'FAILED' ? 'red' : 'slate'}>
                  {summary.lastStatus ?? '—'}
                </Badge>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary-50">
                <HardDrive className="h-4 w-4 text-primary-500" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Taille totale
                </p>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {fmtSize(summary.totalSizeKb)}
                </p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary-50">
                <FileArchive className="h-4 w-4 text-primary-500" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Fichiers
                </p>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {fmt(summary.totalCount)} ({summary.retentionDays}j rétention)
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Quick backup buttons by category */}
      <Card>
        <CardHeader>
          <CardTitle>Sauvegardes par catégorie</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-wrap gap-3">
          {(['database', 'files', 'logs'] as const).map((cat) => {
            const Icon = CAT_ICON[cat] ?? Database;
            return (
              <Button
                key={cat}
                variant="secondary"
                onClick={() => runCategory(cat)}
                loading={running}
              >
                <Icon className="h-4 w-4" />
                Backup {CAT_LABEL[cat]}
                {summary && (
                  <span className="ml-1 text-xs text-slate-400">
                    ({summary.byCategory[cat] ?? 0})
                  </span>
                )}
              </Button>
            );
          })}
        </CardBody>
      </Card>

      {/* Backup files table */}
      <Card>
        <CardHeader>
          <CardTitle>Fichiers de sauvegarde</CardTitle>
          <Badge tone="slate">{files.length} fichier(s)</Badge>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          <Table>
            <Thead>
              <Tr>
                <Th>Fichier</Th>
                <Th>Catégorie</Th>
                <Th>Taille</Th>
                <Th>SHA-256</Th>
                <Th>Date</Th>
                <Th>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {files.length === 0 ? (
                <Tr>
                  <Td colSpan={6} className="text-center text-slate-400 py-6">
                    Aucune sauvegarde. Lancez un backup pour commencer.
                  </Td>
                </Tr>
              ) : (
                files.map((f) => (
                  <Tr key={`${f.category}-${f.filename}`}>
                    <Td className="font-mono text-xs">{f.filename}</Td>
                    <Td>
                      <Badge tone="blue">{CAT_LABEL[f.category] ?? f.category}</Badge>
                    </Td>
                    <Td>{fmtSize(f.sizeKb)}</Td>
                    <Td className="font-mono text-[10px] text-slate-400">
                      {f.sha256.slice(0, 16)}…
                    </Td>
                    <Td className="whitespace-nowrap text-sm">
                      {formatDate(f.createdAt)}
                    </Td>
                    <Td>
                      {f.category === 'database' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRestoreFile(f.filename)}
                        >
                          Restaurer
                        </Button>
                      )}
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      {/* Log viewer */}
      <Card>
        <CardHeader>
          <CardTitle>Journal des sauvegardes</CardTitle>
        </CardHeader>
        <CardBody>
          <pre className="bg-slate-900 text-emerald-400 text-xs font-mono p-4 rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
            {logText || 'Aucun log disponible.'}
          </pre>
        </CardBody>
      </Card>

      <ConfirmDialog
        open={!!restoreFile}
        title="Restaurer la base de données ?"
        description={
          <span>
            Vous êtes sur le point de restaurer la base de données depuis{' '}
            <strong>{restoreFile}</strong>. Cette opération écrasera les données actuelles.
            Assurez-vous d'avoir une sauvegarde récente.
          </span>
        }
        tone="danger"
        confirmLabel="Oui, restaurer"
        cancelLabel="Annuler"
        loading={restoring}
        onConfirm={doRestore}
        onCancel={() => setRestoreFile(null)}
      />
    </div>
  );
}
