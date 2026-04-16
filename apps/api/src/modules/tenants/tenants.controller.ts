import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Patch,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UpdateTenantSelfDto } from './dto/update-tenant-self.dto';
import { TenantsService } from './tenants.service';

/**
 * Tenant self-service endpoints scoped to the authenticated user's tenant.
 * Only ADMIN of the tenant may mutate.
 */
@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly service: TenantsService) {}

  @Get('me')
  async me(@CurrentUser() user: JwtPayload) {
    if (!user.tenantId) throw new NotFoundException('No tenant attached to this user');
    return this.service.getByIdOrFail(user.tenantId);
  }

  @Roles('ADMIN')
  @Patch('me')
  async update(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateTenantSelfDto,
  ) {
    if (!user.tenantId) {
      throw new ForbiddenException('Super-admin accounts cannot edit a tenant this way');
    }
    return this.service.updateSelf(user.tenantId, dto);
  }
}
