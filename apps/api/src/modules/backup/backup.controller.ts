import { Controller, Get, Param, Post, Query } from '@nestjs/common';

import { AllowNoTenant } from '../../common/decorators/allow-no-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  BackupService,
  type BackupCategory,
  type BackupEntry,
  type BackupSummary,
  type FullBackupResult,
} from './backup.service';

/**
 * System backup endpoints — SUPER_ADMIN only.
 *
 * Accessible at /platform/system/backups to match the monitoring convention.
 */
@Controller('platform/system/backups')
@AllowNoTenant()
@Roles('SUPER_ADMIN')
export class BackupController {
  constructor(private readonly backup: BackupService) {}

  /** Dashboard summary: last backup date, status, total size, counts. */
  @Get('summary')
  getSummary(): BackupSummary {
    return this.backup.getSummary();
  }

  /** List all backup files, optionally filtered by category. */
  @Get()
  list(
    @Query('category') category?: string,
  ): BackupEntry[] {
    const valid: BackupCategory[] = ['database', 'files', 'logs'];
    const cat = valid.includes(category as BackupCategory)
      ? (category as BackupCategory)
      : undefined;
    return this.backup.list(cat);
  }

  /** View the backup log. */
  @Get('log')
  log(): { log: string } {
    return { log: this.backup.getLog() };
  }

  /** Trigger a full backup (database + files + logs). */
  @Post('run')
  runFull(): Promise<FullBackupResult> {
    return this.backup.runFullBackup();
  }

  /** Trigger a backup for a specific category only. */
  @Post('run/:category')
  async runCategory(
    @Param('category') category: string,
  ): Promise<BackupEntry> {
    switch (category) {
      case 'database':
        return this.backup.backupDatabase();
      case 'files':
        return this.backup.backupFiles();
      case 'logs':
        return this.backup.backupLogs();
      default:
        throw new Error(`Invalid category: ${category}`);
    }
  }

  /** Restore a database backup. */
  @Post('restore/database/:filename')
  async restoreDatabase(
    @Param('filename') filename: string,
  ): Promise<{ message: string }> {
    await this.backup.restoreDatabase(filename);
    return { message: `Database restored from ${filename}` };
  }

  /** Restore files from a backup. */
  @Post('restore/files/:filename')
  async restoreFiles(
    @Param('filename') filename: string,
  ): Promise<{ message: string }> {
    await this.backup.restoreFiles(filename);
    return { message: `Files restored from ${filename}` };
  }
}
