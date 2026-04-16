import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { AllowNoTenant } from '../../common/decorators/allow-no-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { BillingService } from './billing.service';
import { RecordSubscriptionPaymentDto } from './dto/record-payment.dto';

/**
 * Subscription billing endpoints — SUPER_ADMIN only.
 */
@Controller('platform/billing')
@AllowNoTenant()
@Roles('SUPER_ADMIN')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('plans')
  getPlans() {
    return this.billing.getPlans();
  }

  @Get('summary')
  getSummary() {
    return this.billing.getBillingSummary();
  }

  @Get('payments')
  getAllPayments(@Query('limit') limit?: string) {
    const n = Math.min(parseInt(limit ?? '50', 10) || 50, 200);
    return this.billing.getAllPayments(n);
  }

  @Get('payments/:tenantId')
  getPayments(@Param('tenantId') tenantId: string) {
    return this.billing.getPayments(tenantId);
  }

  @Post('pay/:tenantId')
  recordPayment(
    @Param('tenantId') tenantId: string,
    @Body() dto: RecordSubscriptionPaymentDto,
  ) {
    return this.billing.recordPayment(tenantId, dto);
  }
}
