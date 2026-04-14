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
  UseGuards,
} from '@nestjs/common';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CreateCreditDto } from './dto/create-credit.dto';
import { ListCreditsDto } from './dto/list-credits.dto';
import { RecordCreditPaymentDto } from './dto/record-payment.dto';
import { VehicleCreditsService } from './vehicle-credits.service';

@Controller('vehicle-credits')
@UseGuards(TenantGuard)
export class VehicleCreditsController {
  constructor(private readonly credits: VehicleCreditsService) {}

  @Get()
  list(@CurrentTenant() tenantId: string, @Query() query: ListCreditsDto) {
    return this.credits.list(tenantId, query);
  }

  @Get(':id')
  get(@CurrentTenant() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.credits.get(tenantId, id);
  }

  @Get(':id/schedule')
  schedule(@CurrentTenant() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.credits.schedule(tenantId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateCreditDto) {
    return this.credits.create(tenantId, dto);
  }

  @Post(':id/payments/:paymentId')
  recordPayment(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Body() dto: RecordCreditPaymentDto,
  ) {
    return this.credits.recordPayment(tenantId, id, paymentId, dto);
  }
}
