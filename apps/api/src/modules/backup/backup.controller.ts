import { Controller, Get, Param, Post } from '@nestjs/common';

import { AllowNoTenant } from '../../common/decorators/allow-no-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { BackupService, type BackupEntry } from './backup.service';

/**
 * Backup endpoints — restricted to SUPER_ADMIN only.
 */
@Controller('backup')
@AllowNoTenant()
@Roles('SUPER_ADMIN')
export class BackupController {
  constructor(private readonly backup: BackupService) {}

  @Get()
  list(): BackupEntry[] {
    return this.backup.list();
  }

  @Get('log')
  log(): { log: string } {
    return { log: this.backup.getLog() };
  }

  @Post('run')
  run(): Promise<BackupEntry> {
    return this.backup.createBackup();
  }

  @Post('restore/:filename')
  async restore(@Param('filename') filename: string): Promise<{ message: string }> {
    await this.backup.restore(filename);
    return { message: `Database restored from ${filename}` };
  }
}
