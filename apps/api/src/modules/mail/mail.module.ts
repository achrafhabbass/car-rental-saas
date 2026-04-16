import { Global, Module } from '@nestjs/common';

import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { NotificationService } from './notification.service';

@Global()
@Module({
  controllers: [MailController],
  providers: [MailService, NotificationService],
  exports: [MailService, NotificationService],
})
export class MailModule {}
