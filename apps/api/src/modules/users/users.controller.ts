import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

/**
 * Team user management — ADMIN only, scoped to current tenant.
 */
@ApiTags('Users')
@Controller('users')
@Roles('ADMIN')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(@CurrentTenant() tenantId: string) {
    return this.users.listForTenant(tenantId);
  }

  @Post()
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateUserDto,
  ) {
    const user = await this.users.createForTenant(tenantId, dto);
    // Strip passwordHash from response
    const { passwordHash, mfaSecret, ...safe } = user as any;
    return safe;
  }

  @Patch(':id')
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    const user = await this.users.updateUser(tenantId, id, dto);
    const { passwordHash, mfaSecret, ...safe } = user as any;
    return safe;
  }

  @Delete(':id')
  async softDelete(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    await this.users.softDeleteUser(tenantId, id);
    return { message: 'Utilisateur supprimé' };
  }

  @Post(':id/restore')
  async restore(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const user = await this.users.restoreUser(tenantId, id);
    const { passwordHash, mfaSecret, ...safe } = user as any;
    return safe;
  }

  @Post(':id/reset-password')
  async resetPassword(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const newPassword = await this.users.resetPassword(tenantId, id);
    return { newPassword };
  }
}
