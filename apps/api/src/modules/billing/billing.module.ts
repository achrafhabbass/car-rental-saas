import { Module } from '@nestjs/common';

import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PlanLimitService } from './plan-limit.service';

@Module({
  controllers: [BillingController],
  providers: [BillingService, PlanLimitService],
  exports: [BillingService, PlanLimitService],
})
export class BillingModule {}
