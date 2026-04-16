import { Module } from '@nestjs/common';

import { PlatformModule } from '../platform/platform.module';
import { SoftDeleteController } from './soft-delete.controller';
import { SoftDeleteService } from './soft-delete.service';

@Module({
  imports: [PlatformModule],
  controllers: [SoftDeleteController],
  providers: [SoftDeleteService],
})
export class SoftDeleteModule {}
