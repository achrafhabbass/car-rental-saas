import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { execSync } from 'child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
  readFileSync,
} from 'fs';
import { join, resolve } from 'path';

export interface BackupEntry {
  filename: string;
  sizeKb: number;
  createdAt: string;
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir: string;
  private readonly retentionDays: number;
  private readonly dbUrl: string;
  private readonly logFile: string;

  constructor(private readonly config: ConfigService) {
    this.backupDir = resolve(config.get<string>('backup.dir', './backups'));
    this.retentionDays = config.get<number>('backup.retentionDays', 30);
    this.dbUrl = config.get<string>('database.url', '');
    this.logFile = join(this.backupDir, 'backup.log');

    if (!existsSync(this.backupDir)) {
      mkdirSync(this.backupDir, { recursive: true });
      this.logger.log(`Created backup directory: ${this.backupDir}`);
    }
  }

  /**
   * Daily cron — runs at 02:00 by default (configurable via BACKUP_CRON).
   * Performs a pg_dump, compresses, prunes old files.
   */
  @Cron(process.env.BACKUP_CRON ?? '0 2 * * *')
  async runScheduled(): Promise<BackupEntry> {
    this.logger.log('Scheduled backup starting…');
    return this.createBackup();
  }

  /**
   * Create a pg_dump backup file.
   */
  async createBackup(): Promise<BackupEntry> {
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `autosphere_${ts}.sql.gz`;
    const filepath = join(this.backupDir, filename);

    try {
      // pg_dump piped to gzip for compression
      execSync(
        `pg_dump "${this.dbUrl}" --no-owner --no-acl | gzip > "${filepath}"`,
        { stdio: 'pipe', timeout: 300_000 },
      );

      const stat = statSync(filepath);
      const entry: BackupEntry = {
        filename,
        sizeKb: Math.round(stat.size / 1024),
        createdAt: new Date().toISOString(),
      };

      this.appendLog(`OK  ${filename}  ${entry.sizeKb} KB`);
      this.logger.log(`Backup created: ${filename} (${entry.sizeKb} KB)`);

      // Prune old backups
      this.prune();

      return entry;
    } catch (err) {
      const msg = (err as Error).message;
      this.appendLog(`FAIL  ${filename}  ${msg}`);
      this.logger.error(`Backup failed: ${msg}`);
      throw err;
    }
  }

  /**
   * Restore from a backup file.
   */
  async restore(filename: string): Promise<void> {
    const filepath = join(this.backupDir, filename);
    if (!existsSync(filepath)) {
      throw new Error(`Backup file not found: ${filename}`);
    }

    this.logger.warn(`Restoring database from ${filename}…`);
    try {
      execSync(
        `gunzip -c "${filepath}" | psql "${this.dbUrl}"`,
        { stdio: 'pipe', timeout: 600_000 },
      );
      this.appendLog(`RESTORE  ${filename}  OK`);
      this.logger.log(`Database restored from ${filename}`);
    } catch (err) {
      const msg = (err as Error).message;
      this.appendLog(`RESTORE_FAIL  ${filename}  ${msg}`);
      this.logger.error(`Restore failed: ${msg}`);
      throw err;
    }
  }

  /**
   * List available backup files.
   */
  list(): BackupEntry[] {
    if (!existsSync(this.backupDir)) return [];
    return readdirSync(this.backupDir)
      .filter((f) => f.endsWith('.sql.gz'))
      .map((f) => {
        const stat = statSync(join(this.backupDir, f));
        return {
          filename: f,
          sizeKb: Math.round(stat.size / 1024),
          createdAt: stat.mtime.toISOString(),
        };
      })
      .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  }

  /**
   * Return the backup log.
   */
  getLog(): string {
    if (!existsSync(this.logFile)) return '';
    return readFileSync(this.logFile, 'utf-8');
  }

  /**
   * Remove backups older than retentionDays.
   */
  private prune(): void {
    const cutoff = Date.now() - this.retentionDays * 24 * 60 * 60 * 1000;
    const files = readdirSync(this.backupDir).filter((f) => f.endsWith('.sql.gz'));
    let removed = 0;
    for (const f of files) {
      const fp = join(this.backupDir, f);
      const stat = statSync(fp);
      if (stat.mtime.getTime() < cutoff) {
        unlinkSync(fp);
        removed++;
        this.appendLog(`PRUNE  ${f}`);
      }
    }
    if (removed > 0) {
      this.logger.log(`Pruned ${removed} backup(s) older than ${this.retentionDays} days`);
    }
  }

  private appendLog(line: string): void {
    const ts = new Date().toISOString();
    try {
      const entry = `${ts}  ${line}\n`;
      writeFileSync(this.logFile, entry, { flag: 'a' });
    } catch {
      // Logging failure should not break backup flow.
    }
  }
}
