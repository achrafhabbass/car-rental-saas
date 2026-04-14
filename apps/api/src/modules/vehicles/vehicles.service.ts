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
import { AlertsService } from '../alerts/alerts.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { ListVehiclesDto } from './dto/list-vehicles.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesRepository } from './vehicles.repository';

@Injectable()
export class VehiclesService {
  constructor(
    private readonly repo: VehiclesRepository,
    private readonly alerts: AlertsService,
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
}
