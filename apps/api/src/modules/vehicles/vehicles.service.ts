import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, Vehicle } from '@prisma/client';

import {
  PaginatedResult,
  buildPagination,
  paginate,
} from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { AlertsService } from '../alerts/alerts.service';
import { BillingService } from '../billing/billing.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { ListVehiclesDto } from './dto/list-vehicles.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesRepository } from './vehicles.repository';

@Injectable()
export class VehiclesService {
  constructor(
    private readonly repo: VehiclesRepository,
    private readonly alerts: AlertsService,
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
  ) {}

  async list(tenantId: string, dto: ListVehiclesDto): Promise<PaginatedResult<Vehicle>> {
    const { skip, take, orderBy } = buildPagination(dto);

    const where: Prisma.VehicleWhereInput = {};
    if (dto.status) where.status = dto.status;
    if (dto.search) {
      where.OR = [
        { registration: { contains: dto.search, mode: 'insensitive' } },
        { brand: { contains: dto.search, mode: 'insensitive' } },
        { model: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.repo.list(tenantId, where, skip, take, orderBy);
    return paginate(items, total, dto);
  }

  async get(tenantId: string, id: string): Promise<Vehicle> {
    const v = await this.repo.findById(tenantId, id);
    if (!v) throw new NotFoundException(`Vehicle ${id} not found`);
    return v;
  }

  async create(tenantId: string, dto: CreateVehicleDto): Promise<Vehicle> {
    // Enforce plan vehicle limit
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (tenant) {
      const limitMsg = await this.billing.checkLimits(tenantId, tenant.plan, 'vehicles');
      if (limitMsg) throw new ConflictException(limitMsg);
    }

    const existing = await this.repo.findByRegistration(tenantId, dto.registration);
    if (existing) {
      throw new ConflictException(
        `Vehicle with registration ${dto.registration} already exists`,
      );
    }
    const created = await this.repo.create({
      tenantId,
      registration: dto.registration,
      brand: dto.brand,
      model: dto.model,
      year: dto.year,
      color: dto.color,
      category: dto.category,
      vin: dto.vin,
      transmission: dto.transmission ?? 'MANUAL',
      fuel: dto.fuel ?? 'PETROL',
      seats: dto.seats ?? 5,
      currentKm: dto.currentKm ?? 0,
      purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
      purchasePrice: dto.purchasePrice,
      dailyRate: dto.dailyRate,
      weeklyRate: dto.weeklyRate,
      monthlyRate: dto.monthlyRate,
      insuranceExpiry: dto.insuranceExpiry ? new Date(dto.insuranceExpiry) : undefined,
      technicalVisitExpiry: dto.technicalVisitExpiry
        ? new Date(dto.technicalVisitExpiry)
        : undefined,
      vignetteExpiry: dto.vignetteExpiry ? new Date(dto.vignetteExpiry) : undefined,
      notes: dto.notes,
    });
    await this.alerts.syncVehicleAlerts(tenantId, created.id);
    return created;
  }

  async update(tenantId: string, id: string, dto: UpdateVehicleDto): Promise<Vehicle> {
    await this.get(tenantId, id);

    const data: Prisma.VehicleUpdateInput = {};
    if (dto.registration !== undefined) data.registration = dto.registration;
    if (dto.brand !== undefined) data.brand = dto.brand;
    if (dto.model !== undefined) data.model = dto.model;
    if (dto.year !== undefined) data.year = dto.year;
    if (dto.color !== undefined) data.color = dto.color;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.vin !== undefined) data.vin = dto.vin;
    if (dto.transmission !== undefined) data.transmission = dto.transmission;
    if (dto.fuel !== undefined) data.fuel = dto.fuel;
    if (dto.seats !== undefined) data.seats = dto.seats;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.currentKm !== undefined) data.currentKm = dto.currentKm;
    if (dto.purchaseDate !== undefined) data.purchaseDate = new Date(dto.purchaseDate);
    if (dto.purchasePrice !== undefined) data.purchasePrice = dto.purchasePrice;
    if (dto.dailyRate !== undefined) data.dailyRate = dto.dailyRate;
    if (dto.weeklyRate !== undefined) data.weeklyRate = dto.weeklyRate;
    if (dto.monthlyRate !== undefined) data.monthlyRate = dto.monthlyRate;
    if (dto.insuranceExpiry !== undefined)
      data.insuranceExpiry = new Date(dto.insuranceExpiry);
    if (dto.technicalVisitExpiry !== undefined)
      data.technicalVisitExpiry = new Date(dto.technicalVisitExpiry);
    if (dto.vignetteExpiry !== undefined)
      data.vignetteExpiry = new Date(dto.vignetteExpiry);
    if (dto.notes !== undefined) data.notes = dto.notes;

    await this.repo.update(tenantId, id, data);
    await this.alerts.syncVehicleAlerts(tenantId, id);
    return this.get(tenantId, id);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.get(tenantId, id);
    await this.repo.softDelete(tenantId, id);
  }

  /// Returns one row per vehicle with the busy windows (reservations +
  /// contracts) overlapping the requested date range. Used by the
  /// availability calendar UI.
  async getCalendar(
    tenantId: string,
    fromIso: string,
    toIso: string,
    filter: { vehicleId?: string; status?: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'INACTIVE' } = {},
  ): Promise<
    Array<{
      vehicle: { id: string; registration: string; brand: string; model: string; status: string };
      busy: Array<{
        kind: 'RESERVATION' | 'CONTRACT';
        id: string;
        startDate: string;
        endDate: string;
        status: string;
        clientName: string;
      }>;
    }>
  > {
    const from = new Date(fromIso);
    const to = new Date(toIso);
    if (!(to > from)) {
      throw new Error('to must be after from');
    }

    // Fetch in parallel; Prisma applies tenantId via every where below.
    const [vehicles, reservations, contracts] = await Promise.all([
      this.prisma.vehicle.findMany({
        where: {
          tenantId,
          deletedAt: null,
          id: filter.vehicleId,
          status: filter.status,
        },
        select: { id: true, registration: true, brand: true, model: true, status: true },
        orderBy: { registration: 'asc' },
      }),
      this.prisma.reservation.findMany({
        where: {
          tenantId,
          status: { in: ['PENDING', 'CONFIRMED'] },
          AND: [{ startDate: { lt: to } }, { endDate: { gt: from } }],
          ...(filter.vehicleId ? { vehicleId: filter.vehicleId } : {}),
        },
        select: {
          id: true,
          vehicleId: true,
          startDate: true,
          endDate: true,
          status: true,
          client: { select: { fullName: true } },
        },
      }),
      this.prisma.rentalContract.findMany({
        where: {
          tenantId,
          status: { in: ['ACTIVE', 'OVERDUE', 'RETURNED'] },
          AND: [{ startDate: { lt: to } }, { endDate: { gt: from } }],
          ...(filter.vehicleId ? { vehicleId: filter.vehicleId } : {}),
        },
        select: {
          id: true,
          vehicleId: true,
          startDate: true,
          endDate: true,
          status: true,
          client: { select: { fullName: true } },
        },
      }),
    ]);

    return vehicles.map((v) => ({
      vehicle: v,
      busy: [
        ...reservations
          .filter((r) => r.vehicleId === v.id)
          .map((r) => ({
            kind: 'RESERVATION' as const,
            id: r.id,
            startDate: r.startDate.toISOString(),
            endDate: r.endDate.toISOString(),
            status: r.status,
            clientName: r.client?.fullName ?? '—',
          })),
        ...contracts
          .filter((c) => c.vehicleId === v.id)
          .map((c) => ({
            kind: 'CONTRACT' as const,
            id: c.id,
            startDate: c.startDate.toISOString(),
            endDate: c.endDate.toISOString(),
            status: c.status,
            clientName: c.client?.fullName ?? '—',
          })),
      ].sort((a, b) => (a.startDate < b.startDate ? -1 : 1)),
    }));
  }
}
