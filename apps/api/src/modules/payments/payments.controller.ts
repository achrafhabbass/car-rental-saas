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
import { Roles } from '../../common/decorators/roles.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ListPaymentsDto } from './dto/list-payments.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  list(@CurrentTenant() tenantId: string, @Query() query: ListPaymentsDto) {
    return this.payments.list(tenantId, query);
  }

  @Get(':id')
  get(@CurrentTenant() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.payments.get(tenantId, id);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE', 'ACCOUNTANT')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentTenant() tenantId: string, @Body() dto: CreatePaymentDto) {
    return this.payments.create(tenantId, dto);
  }
}
