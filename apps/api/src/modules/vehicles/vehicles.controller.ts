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
  Res,
} from '@nestjs/common';
import type { Response } from 'express';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SkipEnvelope } from '../../common/decorators/skip-envelope.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { ExportService } from '../exports/export.service';
import type { ExportData } from '../exports/export.service';
import { CalendarQueryDto } from './dto/calendar.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { ListVehiclesDto } from './dto/list-vehicles.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesService } from './vehicles.service';

@Controller('vehicles')
export class VehiclesController {
  constructor(
    private readonly vehicles: VehiclesService,
    private readonly exportService: ExportService,
    private readonly prisma: PrismaService,
  ) {}

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

  @SkipEnvelope()
  @Get('export')
  async export(
    @CurrentTenant() tenantId: string,
    @Query('format') format: string = 'xlsx',
    @Res() res: Response,
  ): Promise<void> {
    const rows = await this.prisma.vehicle.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    const data: ExportData = {
      title: 'Véhicules',
      columns: [
        { header: 'Immatriculation', key: 'registration', width: 18 },
        { header: 'Marque', key: 'brand', width: 16 },
        { header: 'Modèle', key: 'model', width: 16 },
        { header: 'Année', key: 'year', width: 10 },
        { header: 'Couleur', key: 'color', width: 14 },
        { header: 'Statut', key: 'status', width: 14 },
        { header: 'Km actuel', key: 'currentKm', width: 12 },
        { header: 'Tarif/jour', key: 'dailyRate', width: 12 },
      ],
      rows: rows.map((v) => ({
        registration: v.registration,
        brand: v.brand,
        model: v.model,
        year: v.year,
        color: v.color ?? '',
        status: v.status,
        currentKm: v.currentKm,
        dailyRate: Number(v.dailyRate),
      })),
    };

    if (format === 'pdf') {
      const stream = this.exportService.toPdf(data);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="vehicules.pdf"');
      res.setHeader('Cache-Control', 'no-store');
      stream.pipe(res);
    } else {
      const buffer = await this.exportService.toExcel(data);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', 'attachment; filename="vehicules.xlsx"');
      res.setHeader('Cache-Control', 'no-store');
      res.send(buffer);
    }
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
