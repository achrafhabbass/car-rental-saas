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
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { ListInspectionsDto } from './dto/list-inspections.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { InspectionsService } from './inspections.service';

@Controller('inspections')
export class InspectionsController {
  constructor(private readonly inspections: InspectionsService) {}

  @Get()
  list(@CurrentTenant() tenantId: string, @Query() query: ListInspectionsDto) {
    return this.inspections.list(tenantId, query);
  }

  @Get(':id')
  get(@CurrentTenant() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.inspections.get(tenantId, id);
  }

  @Get('contracts/:contractId/all')
  forContract(
    @CurrentTenant() tenantId: string,
    @Param('contractId', ParseUUIDPipe) contractId: string,
  ) {
    return this.inspections.listForContract(tenantId, contractId);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateInspectionDto) {
    return this.inspections.create(tenantId, dto);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Patch(':id')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInspectionDto,
  ) {
    return this.inspections.update(tenantId, id, dto);
  }
}
