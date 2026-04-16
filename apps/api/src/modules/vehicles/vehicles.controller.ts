import {
  Body,
  Controller,
  Delete,
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
import { CalendarQueryDto } from './dto/calendar.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { ListVehiclesDto } from './dto/list-vehicles.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesService } from './vehicles.service';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}

  @Get()
  list(@CurrentTenant() tenantId: string, @Query() query: ListVehiclesDto) {
    return this.vehicles.list(tenantId, query);
  }

  @Get('calendar')
  calendar(@CurrentTenant() tenantId: string, @Query() query: CalendarQueryDto) {
    return this.vehicles.getCalendar(tenantId, query.from, query.to, {
      vehicleId: query.vehicleId,
      status: query.status,
    });
  }

  @Get(':id')
  get(@CurrentTenant() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.vehicles.get(tenantId, id);
  }

  @Roles('ADMIN', 'MANAGER')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateVehicleDto) {
    return this.vehicles.create(tenantId, dto);
  }

  @Roles('ADMIN', 'MANAGER')
  @Patch(':id')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehicles.update(tenantId, id, dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@CurrentTenant() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    await this.vehicles.delete(tenantId, id);
  }
}
