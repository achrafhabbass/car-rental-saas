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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ContractsService } from './contracts.service';
import { CompleteContractDto } from './dto/complete-contract.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { ListContractsDto } from './dto/list-contracts.dto';

@Controller('contracts')
@UseGuards(TenantGuard)
export class ContractsController {
  constructor(private readonly contracts: ContractsService) {}

  @Get()
  list(@CurrentTenant() tenantId: string, @Query() query: ListContractsDto) {
    return this.contracts.list(tenantId, query);
  }

  @Get(':id')
  get(@CurrentTenant() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.contracts.get(tenantId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateContractDto,
  ) {
    return this.contracts.create(tenantId, user.sub, dto);
  }

  @Post(':id/complete')
  complete(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteContractDto,
  ) {
    return this.contracts.complete(tenantId, id, dto);
  }

  @Post(':id/cancel')
  cancel(@CurrentTenant() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.contracts.cancel(tenantId, id);
  }
}
