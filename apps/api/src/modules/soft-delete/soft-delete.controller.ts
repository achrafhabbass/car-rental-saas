import { Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import {
  SoftDeleteService,
  type SoftDeletableEntity,
} from './soft-delete.service';

/**
 * Unified soft-delete + restore endpoints.
 *
 *   DELETE /archive/:entity/:id   → soft-delete
 *   POST   /archive/:entity/:id/restore → restore
 *   GET    /archive/:entity       → list deleted items
 */
@Controller('archive')
@Roles('ADMIN', 'MANAGER')
export class SoftDeleteController {
  constructor(private readonly service: SoftDeleteService) {}

  @Get(':entity')
  listDeleted(
    @CurrentTenant() tenantId: string,
    @Param('entity') entity: string,
  ) {
    this.validate(entity);
    return this.service.listDeleted(entity as SoftDeletableEntity, tenantId);
  }

  @Delete(':entity/:id')
  softDelete(
    @CurrentTenant() tenantId: string,
    @Param('entity') entity: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.validate(entity);
    return this.service.softDelete(
      entity as SoftDeletableEntity,
      tenantId,
      id,
      user.sub,
    );
  }

  @Post(':entity/:id/restore')
  restore(
    @CurrentTenant() tenantId: string,
    @Param('entity') entity: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.validate(entity);
    return this.service.restore(
      entity as SoftDeletableEntity,
      tenantId,
      id,
      user.sub,
    );
  }

  private validate(entity: string): void {
    const valid: string[] = ['vehicle', 'client', 'contract', 'invoice'];
    if (!valid.includes(entity)) {
      throw new Error(`Invalid entity: ${entity}. Must be one of: ${valid.join(', ')}`);
    }
  }
}
