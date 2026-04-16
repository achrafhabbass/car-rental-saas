import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PlatformAuditService } from './platform-audit.service';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';

@Module({
  imports: [AuthModule],
  controllers: [PlatformController],
  providers: [PlatformService, PlatformAuditService],
  exports: [PlatformService, PlatformAuditService],
})
export class PlatformModule {}
