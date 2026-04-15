import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ConvertReservationToContractDto } from './dto/convert-to-contract.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ListReservationsDto } from './dto/list-reservations.dto';
import { UpdateReservationPaymentStatusDto } from './dto/update-payment-status.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { OverdueReservationsSweeper } from './overdue.sweeper';
import { ReservationsService } from './reservations.service';

@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly reservations: ReservationsService,
    private readonly overdueSweeper: OverdueReservationsSweeper,
  ) {}

  @Get()
  list(@CurrentTenant() tenantId: string, @Query() query: ListReservationsDto) {
    return this.reservations.list(tenantId, query);
  }

  @Get(':id')
  get(@CurrentTenant() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.reservations.get(tenantId, id);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateReservationDto) {
    return this.reservations.create(tenantId, dto);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Patch(':id')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReservationDto,
  ) {
    return this.reservations.update(tenantId, id, dto);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE', 'ACCOUNTANT')
  @Patch(':id/payment-status')
  updatePaymentStatus(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReservationPaymentStatusDto,
  ) {
    return this.reservations.updatePaymentStatus(tenantId, id, dto.paymentStatus);
  }

  @Roles('ADMIN', 'MANAGER')
  @Post(':id/cancel')
  cancel(@CurrentTenant() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.reservations.cancel(tenantId, id);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Post(':id/convert-to-contract')
  @HttpCode(HttpStatus.CREATED)
  convert(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConvertReservationToContractDto,
  ) {
    return this.reservations.convertToContract(tenantId, id, user.sub, dto);
  }

  /// Manual trigger for the daily overdue sweep — useful for testing or
  /// after a clock skew. Cron runs automatically every day at 03:00 and
  /// processes BOTH reservations and contracts.
  @Roles('ADMIN', 'MANAGER')
  @Post('overdue/sweep')
  @HttpCode(HttpStatus.OK)
  async sweepOverdue() {
    const reservations = await this.overdueSweeper.sweep();
    const contracts = await this.overdueSweeper.sweepContracts();
    return { reservations, contracts };
  }
}
