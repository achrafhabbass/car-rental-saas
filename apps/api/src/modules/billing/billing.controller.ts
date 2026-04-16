import { Body, Controller, Get, Header, Param, Post, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { AllowNoTenant } from '../../common/decorators/allow-no-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SkipEnvelope } from '../../common/decorators/skip-envelope.decorator';
import { BillingService } from './billing.service';
import { RecordSubscriptionPaymentDto } from './dto/record-payment.dto';

/**
 * Subscription billing endpoints — SUPER_ADMIN only.
 */
@ApiTags('Billing')
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

  @Get('invoices')
  listInvoices(@Query('limit') limit?: string) {
    const n = Math.min(parseInt(limit ?? '50', 10) || 50, 200);
    return this.billing.listInvoices(n);
  }

  @SkipEnvelope()
  @Get('invoices/:id/pdf')
  @Header('Content-Type', 'application/pdf')
  async downloadInvoicePdf(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<NodeJS.ReadableStream> {
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${id}.pdf"`);
    res.setHeader('Cache-Control', 'no-store');
    return this.billing.generateInvoicePdf(id);
  }

  // ---- Receipts ----

  @Get('receipts')
  listReceipts(@Query('limit') limit?: string) {
    const n = Math.min(parseInt(limit ?? '50', 10) || 50, 200);
    return this.billing.listReceipts(n);
  }

  @SkipEnvelope()
  @Get('receipts/:id/pdf')
  @Header('Content-Type', 'application/pdf')
  async downloadReceiptPdf(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<NodeJS.ReadableStream> {
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${id}.pdf"`);
    res.setHeader('Cache-Control', 'no-store');
    return this.billing.generateReceiptPdf(id);
  }
}
