import {
  Controller,
  Get,
  Header,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SkipEnvelope } from '../../common/decorators/skip-envelope.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('dashboard')
  dashboard(@CurrentTenant() tenantId: string) {
    return this.analytics.getDashboardKpis(tenantId);
  }

  @Get('revenue')
  revenue(
    @CurrentTenant() tenantId: string,
    @Query('windowDays') windowDays?: string,
    @Query('granularity') granularity?: 'day' | 'week' | 'month',
  ) {
    const days = Math.min(Math.max(parseInt(windowDays ?? '30', 10) || 30, 1), 365);
    return this.analytics.getRevenueSeries(tenantId, days, granularity ?? 'day');
  }

  @Get('reservations/series')
  reservationsSeries(
    @CurrentTenant() tenantId: string,
    @Query('weeks') weeks?: string,
  ) {
    const w = Math.min(Math.max(parseInt(weeks ?? '12', 10) || 12, 1), 52);
    return this.analytics.getReservationsSeries(tenantId, w);
  }

  @Get('fleet/performance')
  fleetPerformance(
    @CurrentTenant() tenantId: string,
    @Query('limit') limit?: string,
  ) {
    const n = Math.min(Math.max(parseInt(limit ?? '10', 10) || 10, 1), 100);
    return this.analytics.getVehiclePerformance(tenantId, n);
  }

  @Get('clients/top')
  topClients(
    @CurrentTenant() tenantId: string,
    @Query('limit') limit?: string,
  ) {
    const n = Math.min(Math.max(parseInt(limit ?? '10', 10) || 10, 1), 100);
    return this.analytics.getTopClients(tenantId, n);
  }

  // -------- CSV exports --------

  @Roles('ADMIN', 'MANAGER', 'ACCOUNTANT')
  @SkipEnvelope()
  @Get('exports/contracts.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="contracts.csv"')
  async exportContracts(
    @CurrentTenant() tenantId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    res.setHeader('Cache-Control', 'no-store');
    return this.analytics.exportContractsCsv(tenantId);
  }

  @Roles('ADMIN', 'MANAGER', 'ACCOUNTANT')
  @SkipEnvelope()
  @Get('exports/invoices.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="invoices.csv"')
  async exportInvoices(
    @CurrentTenant() tenantId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    res.setHeader('Cache-Control', 'no-store');
    return this.analytics.exportInvoicesCsv(tenantId);
  }

  @Roles('ADMIN', 'MANAGER', 'ACCOUNTANT')
  @SkipEnvelope()
  @Get('exports/payments.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="payments.csv"')
  async exportPayments(
    @CurrentTenant() tenantId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    res.setHeader('Cache-Control', 'no-store');
    return this.analytics.exportPaymentsCsv(tenantId);
  }
}
