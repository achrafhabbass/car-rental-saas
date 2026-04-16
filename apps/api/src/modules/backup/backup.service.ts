import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { NotificationService } from '../mail/notification.service';
import { createHash } from 'crypto';
import { execSync } from 'child_process';
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import { join, resolve } from 'path';

// ─── Types ───

export type BackupCategory = 'database' | 'files' | 'logs';
export type BackupStatus = 'SUCCESS' | 'FAILED';

export interface BackupEntry {
  filename: string;
  category: BackupCategory;
  sizeKb: number;
  sha256: string;
  status: BackupStatus;
  createdAt: string;
}

export interface BackupSummary {
  lastBackupAt: string | null;
  lastStatus: BackupStatus | null;
  totalSizeKb: number;
  totalCount: number;
  byCategory: Record<BackupCategory, number>;
  retentionDays: number;
}

export interface FullBackupResult {
  database: BackupEntry | null;
  files: BackupEntry | null;
  logs: BackupEntry | null;
  duration: number;
}

// ─── Service ───

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly rootDir: string;
  private readonly retentionDays: number;
  private readonly dbUrl: string;
  private readonly logFile: string;

  constructor(
    private readonly config: ConfigService,
    private readonly mailNotifications: NotificationService,
  ) {
    this.rootDir = resolve(config.get<string>('backup.dir', './backups'));
    this.retentionDays = config.get<number>('backup.retentionDays', 30);
    this.dbUrl = config.get<string>('database.url', '');
    this.logFile = join(this.rootDir, 'backup.log');

    // Ensure directory structure
    for (const sub of ['database', 'files', 'logs']) {
      const dir = join(this.rootDir, sub);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }
  }

  // ─── Scheduled full backup ───

  @Cron(process.env.BACKUP_CRON ?? '0 2 * * *')
  async runScheduled(): Promise<FullBackupResult> {
    this.logger.log('Scheduled full backup starting…');
    return this.runFullBackup();
  }

  /**
   * Run a complete backup: database + files + logs.
   */
  async runFullBackup(): Promise<FullBackupResult> {
    const start = Date.now();
    const results: FullBackupResult = {
      database: null,
      files: null,
      logs: null,
      duration: 0,
    };

    results.database = await this.backupDatabase();
    results.files = await this.backupFiles();
    results.logs = await this.backupLogs();
    results.duration = Date.now() - start;

    // Prune old backups
    this.prune();

    this.logger.log(`Full backup completed in ${results.duration}ms`);
    return results;
  }

  // ─── Individual backup methods ───

  async backupDatabase(): Promise<BackupEntry> {
    const ts = this.timestamp();
    const filename = `backup-${ts}.sql.gz`;
    const filepath = join(this.rootDir, 'database', filename);

    try {
      execSync(
        `pg_dump "${this.dbUrl}" --no-owner --no-acl --clean --if-exists | gzip > "${filepath}"`,
        { stdio: 'pipe', timeout: 300_000 },
      );

      const entry = this.buildEntry(filepath, filename, 'database', 'SUCCESS');
      this.appendLog(`OK  DATABASE  ${filename}  ${entry.sizeKb}KB  SHA256:${entry.sha256.slice(0, 16)}`);
      return entry;
    } catch (err) {
      this.appendLog(`FAIL  DATABASE  ${filename}  ${(err as Error).message}`);
      this.logger.error(`Database backup failed: ${(err as Error).message}`);
      void this.mailNotifications.onBackupFailed('database', filename, (err as Error).message);
      return {
        filename,
        category: 'database',
        sizeKb: 0,
        sha256: '',
        status: 'FAILED',
        createdAt: new Date().toISOString(),
      };
    }
  }

  async backupFiles(): Promise<BackupEntry> {
    const ts = this.timestamp();
    const filename = `files-${ts}.tar.gz`;
    const filepath = join(this.rootDir, 'files', filename);

    try {
      // Archive common storage paths if they exist
      const storageDirs = ['uploads', 'storage', 'public/uploads']
        .map((d) => resolve(d))
        .filter((d) => existsSync(d));

      if (storageDirs.length === 0) {
        // Create an empty archive marker
        writeFileSync(filepath, '');
        const entry = this.buildEntry(filepath, filename, 'files', 'SUCCESS');
        this.appendLog(`OK  FILES  ${filename}  (no storage dirs found)`);
        return entry;
      }

      const dirs = storageDirs.map((d) => `"${d}"`).join(' ');
      execSync(`tar -czf "${filepath}" ${dirs}`, {
        stdio: 'pipe',
        timeout: 300_000,
      });

      const entry = this.buildEntry(filepath, filename, 'files', 'SUCCESS');
      this.appendLog(`OK  FILES  ${filename}  ${entry.sizeKb}KB`);
      return entry;
    } catch (err) {
      this.appendLog(`FAIL  FILES  ${filename}  ${(err as Error).message}`);
      this.logger.error(`Files backup failed: ${(err as Error).message}`);
      void this.mailNotifications.onBackupFailed('files', filename, (err as Error).message);
      return {
        filename,
        category: 'files',
        sizeKb: 0,
        sha256: '',
        status: 'FAILED',
        createdAt: new Date().toISOString(),
      };
    }
  }

  async backupLogs(): Promise<BackupEntry> {
    const ts = this.timestamp();
    const filename = `logs-${ts}.tar.gz`;
    const filepath = join(this.rootDir, 'logs', filename);

    try {
      // Archive log files: nest logs, app logs, audit logs from DB
      const logDirs = ['logs', 'dist/logs']
        .map((d) => resolve(d))
        .filter((d) => existsSync(d));

      // Export audit logs from DB as JSON for archival
      const auditPath = join(this.rootDir, 'logs', `audit-export-${ts}.json`);
      try {
        const auditJson = execSync(
          `psql "${this.dbUrl}" -t -A -c "SELECT json_agg(t) FROM (SELECT * FROM platform_audit_logs ORDER BY \\\"createdAt\\\" DESC LIMIT 10000) t"`,
          { stdio: 'pipe', timeout: 60_000 },
        ).toString().trim();
        writeFileSync(auditPath, auditJson || '[]');
        logDirs.push(auditPath);
      } catch {
        // Audit export is best-effort
      }

      // Also include the backup.log itself
      if (existsSync(this.logFile)) {
        logDirs.push(this.logFile);
      }

      if (logDirs.length === 0) {
        writeFileSync(filepath, '');
        const entry = this.buildEntry(filepath, filename, 'logs', 'SUCCESS');
        this.appendLog(`OK  LOGS  ${filename}  (no log dirs found)`);
        return entry;
      }

      const paths = logDirs.map((d) => `"${d}"`).join(' ');
      execSync(`tar -czf "${filepath}" ${paths}`, {
        stdio: 'pipe',
        timeout: 120_000,
      });

      // Clean up temp audit export
      if (existsSync(auditPath)) unlinkSync(auditPath);

      const entry = this.buildEntry(filepath, filename, 'logs', 'SUCCESS');
      this.appendLog(`OK  LOGS  ${filename}  ${entry.sizeKb}KB`);
      return entry;
    } catch (err) {
      this.appendLog(`FAIL  LOGS  ${filename}  ${(err as Error).message}`);
      this.logger.error(`Logs backup failed: ${(err as Error).message}`);
      void this.mailNotifications.onBackupFailed('logs', filename, (err as Error).message);
      return {
        filename,
        category: 'logs',
        sizeKb: 0,
        sha256: '',
        status: 'FAILED',
        createdAt: new Date().toISOString(),
      };
    }
  }

  // ─── Restore ───

  async restoreDatabase(filename: string): Promise<void> {
    const filepath = join(this.rootDir, 'database', filename);
    if (!existsSync(filepath)) {
      throw new NotFoundException(`Backup file not found: database/${filename}`);
    }

    // Verify integrity
    const expected = this.findSha256InLog(filename);
    if (expected) {
      const actual = this.computeSha256(filepath);
      if (actual !== expected) {
        throw new Error(`Integrity check failed for ${filename}: expected ${expected.slice(0, 16)}, got ${actual.slice(0, 16)}`);
      }
    }

    this.logger.warn(`Restoring database from ${filename}…`);
    execSync(`gunzip -c "${filepath}" | psql "${this.dbUrl}"`, {
      stdio: 'pipe',
      timeout: 600_000,
    });
    this.appendLog(`RESTORE  DATABASE  ${filename}  OK`);
    this.logger.log(`Database restored from ${filename}`);
    void this.mailNotifications.onRestoreCompleted('database', filename);
  }

  async restoreFiles(filename: string): Promise<void> {
    const filepath = join(this.rootDir, 'files', filename);
    if (!existsSync(filepath)) {
      throw new NotFoundException(`Backup file not found: files/${filename}`);
    }

    this.logger.warn(`Restoring files from ${filename}…`);
    execSync(`tar -xzf "${filepath}" -C /`, {
      stdio: 'pipe',
      timeout: 300_000,
    });
    this.appendLog(`RESTORE  FILES  ${filename}  OK`);
    this.logger.log(`Files restored from ${filename}`);
  }

  // ─── List / Summary ───

  list(category?: BackupCategory): BackupEntry[] {
    const categories: BackupCategory[] = category
      ? [category]
      : ['database', 'files', 'logs'];

    const entries: BackupEntry[] = [];
    for (const cat of categories) {
      const dir = join(this.rootDir, cat);
      if (!existsSync(dir)) continue;
      const files = readdirSync(dir).filter(
        (f) => f.endsWith('.sql.gz') || f.endsWith('.tar.gz'),
      );
      for (const f of files) {
        entries.push(this.buildEntry(join(dir, f), f, cat, 'SUCCESS'));
      }
    }

    return entries.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  }

  getSummary(): BackupSummary {
    const all = this.list();
    const last = all[0] ?? null;

    const byCategory: Record<BackupCategory, number> = {
      database: 0,
      files: 0,
      logs: 0,
    };
    let totalSizeKb = 0;
    for (const e of all) {
      byCategory[e.category]++;
      totalSizeKb += e.sizeKb;
    }

    // Check log for last status
    let lastStatus: BackupStatus | null = null;
    if (existsSync(this.logFile)) {
      const lines = readFileSync(this.logFile, 'utf-8').trim().split('\n');
      const lastLine = lines[lines.length - 1] ?? '';
      if (lastLine.includes('FAIL')) lastStatus = 'FAILED';
      else if (lastLine.includes('OK')) lastStatus = 'SUCCESS';
    }

    return {
      lastBackupAt: last?.createdAt ?? null,
      lastStatus,
      totalSizeKb,
      totalCount: all.length,
      byCategory,
      retentionDays: this.retentionDays,
    };
  }

  getLog(): string {
    if (!existsSync(this.logFile)) return '';
    return readFileSync(this.logFile, 'utf-8');
  }

  // ─── Private helpers ───

  private prune(): void {
    const cutoff = Date.now() - this.retentionDays * 24 * 60 * 60 * 1000;
    let removed = 0;

    for (const cat of ['database', 'files', 'logs'] as const) {
      const dir = join(this.rootDir, cat);
      if (!existsSync(dir)) continue;
      for (const f of readdirSync(dir)) {
        const fp = join(dir, f);
        try {
          if (statSync(fp).mtime.getTime() < cutoff) {
            unlinkSync(fp);
            removed++;
            this.appendLog(`PRUNE  ${cat}/${f}`);
          }
        } catch {
          // Skip files we can't stat
        }
      }
    }

    if (removed > 0) {
      this.logger.log(`Pruned ${removed} old backup(s)`);
    }
  }

  private buildEntry(
    filepath: string,
    filename: string,
    category: BackupCategory,
    status: BackupStatus,
  ): BackupEntry {
    let sizeKb = 0;
    let sha256 = '';
    try {
      sizeKb = Math.round(statSync(filepath).size / 1024);
      sha256 = this.computeSha256(filepath);
    } catch {
      // File may not exist if backup failed
    }
    return {
      filename,
      category,
      sizeKb,
      sha256,
      status,
      createdAt: new Date().toISOString(),
    };
  }

  private computeSha256(filepath: string): string {
    const hash = createHash('sha256');
    const content = readFileSync(filepath);
    hash.update(content);
    return hash.digest('hex');
  }

  private findSha256InLog(filename: string): string | null {
    if (!existsSync(this.logFile)) return null;
    const lines = readFileSync(this.logFile, 'utf-8').split('\n');
    for (const line of lines.reverse()) {
      if (line.includes(filename) && line.includes('SHA256:')) {
        const match = /SHA256:([a-f0-9]+)/.exec(line);
        if (match) return match[1];
      }
    }
    return null;
  }

  private timestamp(): string {
    return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  }

  private appendLog(line: string): void {
    try {
      writeFileSync(this.logFile, `${new Date().toISOString()}  ${line}\n`, {
        flag: 'a',
      });
    } catch {
      // Never fail on log write
    }
  }
}
