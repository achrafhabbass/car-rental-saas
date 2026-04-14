import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  MaintenanceRecord,
  MaintenanceSchedule,
  Prisma,
} from '@prisma/client';

import {
  PaginatedResult,
  buildPagination,
  paginate,
} from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { AlertsService } from '../alerts/alerts.service';
import { CreateMaintenanceRecordDto } from './dto/create-record.dto';
import { CreateMaintenanceScheduleDto } from './dto/create-schedule.dto';
import { ListMaintenanceRecordsDto } from './dto/list-records.dto';

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alerts: AlertsService,
  ) {}

  // -------- Records --------

  async listRecords(
    tenantId: string,
    dto: ListMaintenanceRecordsDto,
  ): Promise<PaginatedResult<MaintenanceRecord>> {
    const { skip, take, orderBy } = buildPagination(dto);
    const where: Prisma.MaintenanceRecordWhereInput = { tenantId };
    if (dto.vehicleId) where.vehicleId = dto.vehicleId;
    if (dto.type) where.type = dto.type;
    if (dto.search) where.title = { contains: dto.search, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      this.prisma.maintenanceRecord.findMany({
        where,
        skip,
        take,
        orderBy: orderBy ?? { performedAt: 'desc' },
        include: { vehicle: { select: { registration: true, brand: true, model: true } } },
      }),
      this.prisma.maintenanceRecord.count({ where }),
    ]);
    return paginate(items, total, dto);
  }

  async getRecord(tenantId: string, id: string): Promise<MaintenanceRecord> {
    const r = await this.prisma.maintenanceRecord.findFirst({
      where: { id, tenantId },
    });
    if (!r) throw new NotFoundException(`Record ${id} not found`);
    return r;
  }

  async createRecord(
    tenantId: string,
    dto: CreateMaintenanceRecordDto,
  ): Promise<MaintenanceRecord> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: dto.vehicleId, tenantId, deletedAt: null },
    });
    if (!vehicle) throw new NotFoundException(`Vehicle ${dto.vehicleId} not found`);

    const record = await this.prisma.$transaction(async (tx) => {
      const created = await tx.maintenanceRecord.create({
        data: {
          tenantId,
          vehicleId: dto.vehicleId,
          type: dto.type,
          title: dto.title,
          description: dto.description,
          performedAt: dto.performedAt ? new Date(dto.performedAt) : new Date(),
          km: dto.km,
          cost: dto.cost ?? 0,
          garage: dto.garage,
          reference: dto.reference,
          notes: dto.notes,
          status: 'COMPLETED',
        },
      });

      // Keep vehicle kilometer reading fresh if the record reports a newer one
      if (dto.km && dto.km > vehicle.currentKm) {
        await tx.vehicle.update({
          where: { id: vehicle.id },
          data: { currentKm: dto.km },
        });
      }

      // Auto-close any matching SCHEDULED schedule of the same type where the
      // due conditions are now satisfied (date passed and/or km passed).
      await tx.maintenanceSchedule.updateMany({
        where: {
          tenantId,
          vehicleId: vehicle.id,
          type: dto.type,
          status: 'SCHEDULED',
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          completedRecordId: created.id,
        },
      });

      return created;
    });

    // Resync alerts (may resolve MAINTENANCE_OVERDUE / MAINTENANCE_DUE)
    await this.alerts.syncVehicleAlerts(tenantId, dto.vehicleId);
    return record;
  }

  async getVehicleCostSummary(
    tenantId: string,
    vehicleId: string,
  ): Promise<{ totalCost: number; recordCount: number }> {
    const agg = await this.prisma.maintenanceRecord.aggregate({
      where: { tenantId, vehicleId },
      _sum: { cost: true },
      _count: { _all: true },
    });
    return {
      totalCost: Number(agg._sum.cost ?? 0),
      recordCount: agg._count._all,
    };
  }

  // -------- Schedules --------

  async listSchedules(
    tenantId: string,
    filter: { vehicleId?: string; status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' } = {},
  ): Promise<MaintenanceSchedule[]> {
    return this.prisma.maintenanceSchedule.findMany({
      where: {
        tenantId,
        vehicleId: filter.vehicleId,
        status: filter.status ?? 'SCHEDULED',
      },
      orderBy: [{ isCritical: 'desc' }, { dueDate: 'asc' }],
      include: { vehicle: { select: { registration: true, brand: true, model: true } } },
    });
  }

  async createSchedule(
    tenantId: string,
    dto: CreateMaintenanceScheduleDto,
  ): Promise<MaintenanceSchedule> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: dto.vehicleId, tenantId, deletedAt: null },
    });
    if (!vehicle) throw new NotFoundException(`Vehicle ${dto.vehicleId} not found`);

    const s = await this.prisma.maintenanceSchedule.create({
      data: {
        tenantId,
        vehicleId: dto.vehicleId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        dueKm: dto.dueKm ?? null,
        isCritical: dto.isCritical ?? false,
        notes: dto.notes,
      },
    });

    await this.alerts.syncVehicleAlerts(tenantId, dto.vehicleId);
    return s;
  }

  async cancelSchedule(tenantId: string, id: string): Promise<void> {
    const res = await this.prisma.maintenanceSchedule.updateMany({
      where: { id, tenantId, status: 'SCHEDULED' },
      data: { status: 'CANCELLED' },
    });
    if (res.count === 0) throw new NotFoundException(`Schedule ${id} not found`);

    const schedule = await this.prisma.maintenanceSchedule.findUnique({ where: { id } });
    if (schedule) {
      await this.alerts.syncVehicleAlerts(tenantId, schedule.vehicleId);
    }
  }
}
