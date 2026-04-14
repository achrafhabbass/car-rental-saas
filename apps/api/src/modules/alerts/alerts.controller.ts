import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { AlertSeverity, AlertStatus } from '@prisma/client';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AlertsService } from './alerts.service';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alerts: AlertsService) {}

  @Get()
  list(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: AlertStatus,
    @Query('severity') severity?: AlertSeverity,
    @Query('vehicleId') vehicleId?: string,
  ) {
    return this.alerts.list(tenantId, { status, severity, vehicleId });
  }

  @Get('summary')
  summary(@CurrentTenant() tenantId: string) {
    return this.alerts.summary(tenantId);
  }

  @Roles('ADMIN', 'MANAGER')
  @Post(':id/acknowledge')
  acknowledge(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.alerts.acknowledge(tenantId, id);
  }

  @Roles('ADMIN', 'MANAGER')
  @Post(':id/resolve')
  resolve(@CurrentTenant() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.alerts.resolve(tenantId, id);
  }

  @Roles('ADMIN', 'MANAGER')
  @Post('resync')
  @HttpCode(HttpStatus.OK)
  resync(@CurrentTenant() tenantId: string) {
    return this.alerts.syncAll(tenantId);
  }
}
