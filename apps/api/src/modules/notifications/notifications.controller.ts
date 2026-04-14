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

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: 'UNREAD' | 'READ' | 'ARCHIVED',
    @Query('limit') limit?: string,
  ) {
    return this.notifications.list(tenantId, user.sub, {
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('summary')
  summary(@CurrentTenant() tenantId: string, @CurrentUser() user: JwtPayload) {
    return this.notifications.summary(tenantId, user.sub);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markRead(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.notifications.markRead(tenantId, user.sub, id);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  markAllRead(@CurrentTenant() tenantId: string, @CurrentUser() user: JwtPayload) {
    return this.notifications.markAllRead(tenantId, user.sub);
  }
}
