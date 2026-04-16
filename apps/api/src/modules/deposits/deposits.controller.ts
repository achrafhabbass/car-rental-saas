import {
  Body,
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
import { Roles } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CollectDepositDto } from './dto/collect-deposit.dto';
import { SettleDepositDto } from './dto/settle-deposit.dto';
import { DepositsService } from './deposits.service';

@Controller('deposits')
export class DepositsController {
  constructor(private readonly deposits: DepositsService) {}

  @Get()
  list(@CurrentTenant() tenantId: string, @Query('contractId') contractId?: string) {
    return this.deposits.list(tenantId, contractId);
  }

  @Get(':id')
  get(@CurrentTenant() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.deposits.get(tenantId, id);
  }

  @Get('contracts/:contractId')
  forContract(
    @CurrentTenant() tenantId: string,
    @Param('contractId', ParseUUIDPipe) contractId: string,
  ) {
    return this.deposits.getForContract(tenantId, contractId);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE', 'ACCOUNTANT')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  collect(@CurrentTenant() tenantId: string, @Body() dto: CollectDepositDto) {
    return this.deposits.collect(tenantId, dto);
  }

  @Roles('ADMIN', 'MANAGER', 'ACCOUNTANT')
  @Post(':id/refund-full')
  refundFull(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deposits.refundFull(tenantId, id, user.sub);
  }

  @Roles('ADMIN', 'MANAGER', 'ACCOUNTANT')
  @Post(':id/refund-partial')
  refundPartial(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SettleDepositDto,
  ) {
    return this.deposits.refundPartial(tenantId, id, user.sub, dto);
  }

  @Roles('ADMIN', 'MANAGER', 'ACCOUNTANT')
  @Post(':id/consume')
  consume(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SettleDepositDto,
  ) {
    return this.deposits.consume(tenantId, id, user.sub, dto);
  }
}
