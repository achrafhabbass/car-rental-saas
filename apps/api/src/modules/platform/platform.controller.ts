import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { AllowNoTenant } from '../../common/decorators/allow-no-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ListTenantsDto } from './dto/list-tenants.dto';
import {
  ExtendSubscriptionDto,
  ExtendTrialDto,
  SuspendTenantDto,
  UpdateTenantPlatformDto,
} from './dto/update-tenant.dto';
import { PlatformService } from './platform.service';

/**
 * Platform (SUPER_ADMIN) endpoints. Every route here is:
 *   - restricted to SUPER_ADMIN (@Roles)
 *   - allowed without a tenant context (@AllowNoTenant) since super-admins
 *     operate cross-tenant.
 */
@Controller('platform')
@Roles('SUPER_ADMIN')
@AllowNoTenant()
export class PlatformController {
  constructor(private readonly platform: PlatformService) {}

  @Get('metrics')
  metrics() {
    return this.platform.getMetrics();
  }

  @Get('tenants')
  list(@Query() query: ListTenantsDto) {
    return this.platform.list(query);
  }

  @Get('tenants/:id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.platform.getSummary(id);
  }

  @Patch('tenants/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantPlatformDto,
  ) {
    return this.platform.update(id, dto);
  }

  @Post('tenants/:id/suspend')
  suspend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuspendTenantDto,
  ) {
    return this.platform.suspend(id, dto);
  }

  @Post('tenants/:id/activate')
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.platform.activate(id);
  }

  @Post('tenants/:id/cancel')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuspendTenantDto,
  ) {
    return this.platform.cancel(id, dto);
  }

  @Post('tenants/:id/extend-trial')
  extendTrial(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExtendTrialDto,
  ) {
    return this.platform.extendTrial(id, dto);
  }

  @Post('tenants/:id/extend-subscription')
  extendSubscription(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExtendSubscriptionDto,
  ) {
    return this.platform.extendSubscription(id, dto);
  }

  @Delete('tenants/:id')
  @HttpCode(HttpStatus.OK)
  softDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.platform.softDelete(id);
  }

  @Post('sweep-expiries')
  sweep() {
    return this.platform.sweepExpiries();
  }
}
