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
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PlatformAuditAction } from '@prisma/client';
import type { Request } from 'express';

import { AllowNoTenant } from '../../common/decorators/allow-no-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ListTenantsDto } from './dto/list-tenants.dto';
import {
  ExtendSubscriptionDto,
  ExtendTrialDto,
  SuspendTenantDto,
  UpdateTenantPlatformDto,
} from './dto/update-tenant.dto';
import { PlatformAuditService } from './platform-audit.service';
import { PlatformService } from './platform.service';

/**
 * Platform (SUPER_ADMIN) endpoints. Every route here is:
 *   - restricted to SUPER_ADMIN (@Roles)
 *   - allowed without a tenant context (@AllowNoTenant) since super-admins
 *     operate cross-tenant.
 * Every mutating route records an entry in PlatformAuditLog through
 * PlatformAuditService after the underlying service call succeeds.
 */
@ApiTags('Platform')
@Controller('platform')
@Roles('SUPER_ADMIN')
@AllowNoTenant()
export class PlatformController {
  constructor(
    private readonly platform: PlatformService,
    private readonly audit: PlatformAuditService,
  ) {}

  private ctx(req: Request) {
    return {
      ipAddress: (req.ip ?? req.headers['x-forwarded-for']?.toString()) ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    };
  }

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
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantPlatformDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const result = await this.platform.update(id, dto);
    await this.audit.record({
      action: PlatformAuditAction.TENANT_UPDATE,
      actorUserId: user.sub,
      tenantId: id,
      metadata: JSON.parse(JSON.stringify(dto)),
      ...this.ctx(req),
    });
    return result;
  }

  @Post('tenants/:id/suspend')
  async suspend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuspendTenantDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const result = await this.platform.suspend(id, dto);
    await this.audit.record({
      action: PlatformAuditAction.TENANT_SUSPEND,
      actorUserId: user.sub,
      tenantId: id,
      metadata: dto.reason ? { reason: dto.reason } : undefined,
      ...this.ctx(req),
    });
    return result;
  }

  @Post('tenants/:id/activate')
  async activate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const result = await this.platform.activate(id);
    await this.audit.record({
      action: PlatformAuditAction.TENANT_ACTIVATE,
      actorUserId: user.sub,
      tenantId: id,
      ...this.ctx(req),
    });
    return result;
  }

  @Post('tenants/:id/cancel')
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuspendTenantDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const result = await this.platform.cancel(id, dto);
    await this.audit.record({
      action: PlatformAuditAction.TENANT_CANCEL,
      actorUserId: user.sub,
      tenantId: id,
      metadata: dto.reason ? { reason: dto.reason } : undefined,
      ...this.ctx(req),
    });
    return result;
  }

  @Post('tenants/:id/extend-trial')
  async extendTrial(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExtendTrialDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const result = await this.platform.extendTrial(id, dto);
    await this.audit.record({
      action: PlatformAuditAction.TENANT_EXTEND_TRIAL,
      actorUserId: user.sub,
      tenantId: id,
      metadata: { days: dto.days },
      ...this.ctx(req),
    });
    return result;
  }

  @Post('tenants/:id/extend-subscription')
  async extendSubscription(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExtendSubscriptionDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const result = await this.platform.extendSubscription(id, dto);
    await this.audit.record({
      action: PlatformAuditAction.TENANT_EXTEND_SUBSCRIPTION,
      actorUserId: user.sub,
      tenantId: id,
      metadata: JSON.parse(JSON.stringify(dto)),
      ...this.ctx(req),
    });
    return result;
  }

  @Delete('tenants/:id')
  @HttpCode(HttpStatus.OK)
  async softDelete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const result = await this.platform.softDelete(id);
    await this.audit.record({
      action: PlatformAuditAction.TENANT_DELETE,
      actorUserId: user.sub,
      tenantId: id,
      ...this.ctx(req),
    });
    return result;
  }

  @Post('tenants/:id/impersonate')
  @HttpCode(HttpStatus.OK)
  async impersonate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const result = await this.platform.impersonate(id, user.sub);
    await this.audit.record({
      action: PlatformAuditAction.IMPERSONATE,
      actorUserId: user.sub,
      tenantId: id,
      metadata: { impersonatedUserId: result.user.id },
      ...this.ctx(req),
    });
    return result;
  }

  @Post('sweep-expiries')
  async sweep(@CurrentUser() user: JwtPayload, @Req() req: Request) {
    const result = await this.platform.sweepExpiries();
    await this.audit.record({
      action: PlatformAuditAction.SWEEP_EXPIRIES,
      actorUserId: user.sub,
      metadata: { expired: result.expired },
      ...this.ctx(req),
    });
    return result;
  }

  @Get('audit-logs')
  auditLogs(
    @Query('action') action?: PlatformAuditAction,
    @Query('actorUserId') actorUserId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.audit.list({
      action,
      actorUserId,
      tenantId,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
