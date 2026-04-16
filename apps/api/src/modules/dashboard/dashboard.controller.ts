import { Controller, Get } from '@nestjs/common';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('badges')
  badges(@CurrentTenant() tenantId: string) {
    return this.dashboard.getBadges(tenantId);
  }
}
