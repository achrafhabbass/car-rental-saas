import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import type { AppConfig } from '../../config/configuration';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => ({
        // Stream into memory so the service uploads to Cloudinary without
        // ever touching disk. Bounded by the same maxBytes the service
        // re-checks, so a malicious oversize POST is rejected by Multer first.
        storage: memoryStorage(),
        limits: { fileSize: config.get('uploads', { infer: true }).maxBytes },
      }),
    }),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
