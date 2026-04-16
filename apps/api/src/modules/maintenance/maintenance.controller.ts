import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateMaintenanceRecordDto } from './dto/create-record.dto';
import { CreateMaintenanceScheduleDto } from './dto/create-schedule.dto';
import { ListMaintenanceRecordsDto } from './dto/list-records.dto';
import { MaintenanceService } from './maintenance.service';

@ApiTags('Maintenance')
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly service: MaintenanceService) {}

  // -------- Records --------

  @Get('records')
  listRecords(
    @CurrentTenant() tenantId: string,
    @Query() query: ListMaintenanceRecordsDto,
  ) {
    return this.service.listRecords(tenantId, query);
  }

  @Get('records/:id')
  getRecord(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.getRecord(tenantId, id);
  }

  @Roles('ADMIN', 'MANAGER')
  @Post('records')
  @HttpCode(HttpStatus.CREATED)
  createRecord(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateMaintenanceRecordDto,
  ) {
    return this.service.createRecord(tenantId, dto);
  }

  @Get('vehicles/:vehicleId/cost')
  vehicleCost(
    @CurrentTenant() tenantId: string,
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
  ) {
    return this.service.getVehicleCostSummary(tenantId, vehicleId);
  }

  // -------- Schedules --------

  @Get('schedules')
  listSchedules(
    @CurrentTenant() tenantId: string,
    @Query('vehicleId') vehicleId?: string,
    @Query('status') status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED',
  ) {
    return this.service.listSchedules(tenantId, { vehicleId, status });
  }

  @Roles('ADMIN', 'MANAGER')
  @Post('schedules')
  @HttpCode(HttpStatus.CREATED)
  createSchedule(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateMaintenanceScheduleDto,
  ) {
    return this.service.createSchedule(tenantId, dto);
  }

  @Roles('ADMIN', 'MANAGER')
  @Delete('schedules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelSchedule(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.service.cancelSchedule(tenantId, id);
  }
}
