import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SkipEnvelope } from '../../common/decorators/skip-envelope.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ContractsService } from './contracts.service';
import { CompleteContractDto } from './dto/complete-contract.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { ListContractsDto } from './dto/list-contracts.dto';

@Controller('contracts')
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

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateContractDto,
  ) {
    return this.contracts.create(tenantId, user.sub, dto);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Post(':id/complete')
  complete(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteContractDto,
  ) {
    return this.contracts.complete(tenantId, id, dto);
  }

  @Roles('ADMIN', 'MANAGER')
  @Post(':id/cancel')
  cancel(@CurrentTenant() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.contracts.cancel(tenantId, id);
  }

  @SkipEnvelope()
  @Get(':id/pdf')
  @Header('Content-Type', 'application/pdf')
  async pdf(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ): Promise<void> {
    const stream = await this.contracts.generatePdfStream(tenantId, id);
    res.setHeader('Content-Disposition', `attachment; filename="contract-${id}.pdf"`);
    res.setHeader('Cache-Control', 'no-store');
    stream.pipe(res);
  }
}
