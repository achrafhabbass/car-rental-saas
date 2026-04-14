import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, Reservation } from '@prisma/client';

import {
  PaginatedResult,
  buildPagination,
  paginate,
} from '../../common/dto/pagination.dto';
import { ClientsService } from '../clients/clients.service';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import { VehiclesService } from '../vehicles/vehicles.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ListReservationsDto } from './dto/list-reservations.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationsRepository } from './reservations.repository';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly repo: ReservationsRepository,
    private readonly vehicles: VehiclesService,
    private readonly vehiclesRepo: VehiclesRepository,
    private readonly clients: ClientsService,
  ) {}

  async list(
    tenantId: string,
    dto: ListReservationsDto,
  ): Promise<PaginatedResult<Reservation>> {
    const { skip, take, orderBy } = buildPagination(dto);
    const where: Prisma.ReservationWhereInput = {};
    if (dto.status) where.status = dto.status;
    if (dto.vehicleId) where.vehicleId = dto.vehicleId;
    if (dto.clientId) where.clientId = dto.clientId;
    if (dto.fromDate) where.endDate = { gte: new Date(dto.fromDate) };
    if (dto.toDate) {
      where.startDate = { ...(where.startDate as object), lte: new Date(dto.toDate) };
    }
    if (dto.search) {
      where.reservationCode = { contains: dto.search, mode: 'insensitive' };
    }
    const [items, total] = await this.repo.list(tenantId, where, skip, take, orderBy);
    return paginate(items, total, dto);
  }

  async get(tenantId: string, id: string): Promise<Reservation> {
    const r = await this.repo.findById(tenantId, id);
    if (!r) throw new NotFoundException(`Reservation ${id} not found`);
    return r;
  }

  async create(tenantId: string, dto: CreateReservationDto): Promise<Reservation> {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (!(end > start)) {
      throw new BadRequestException('endDate must be after startDate');
    }

    const vehicle = await this.vehicles.get(tenantId, dto.vehicleId);
    await this.clients.assertNotBlacklisted(tenantId, dto.clientId);

    const overlap = await this.vehiclesRepo.hasOverlap(tenantId, vehicle.id, start, end);
    if (overlap) {
      throw new ConflictException(
        `Vehicle ${vehicle.registration} already has a booking overlapping this window`,
      );
    }

    const dailyRate = Number(dto.dailyRate ?? vehicle.dailyRate);
    const days = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)),
    );
    const totalAmount = dailyRate * days;

    const reservationCode = await this.repo.generateCode(tenantId);

    return this.repo.create({
      tenantId,
      reservationCode,
      vehicleId: dto.vehicleId,
      clientId: dto.clientId,
      startDate: start,
      endDate: end,
      pickupLocation: dto.pickupLocation,
      returnLocation: dto.returnLocation,
      dailyRate,
      totalAmount,
      source: dto.source ?? 'DIRECT',
      notes: dto.notes,
    });
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateReservationDto,
  ): Promise<Reservation> {
    const current = await this.get(tenantId, id);
    if (current.status === 'CONVERTED') {
      throw new ConflictException('Cannot modify a reservation already converted to a contract');
    }

    const data: Prisma.ReservationUpdateInput = {};
    if (dto.vehicleId !== undefined || dto.startDate !== undefined || dto.endDate !== undefined) {
      const vehicleId = dto.vehicleId ?? current.vehicleId;
      const start = new Date(dto.startDate ?? current.startDate);
      const end = new Date(dto.endDate ?? current.endDate);
      if (!(end > start)) {
        throw new BadRequestException('endDate must be after startDate');
      }
      const overlap = await this.vehiclesRepo.hasOverlap(
        tenantId,
        vehicleId,
        start,
        end,
        id,
      );
      if (overlap) {
        throw new ConflictException('Vehicle has an overlapping booking for this window');
      }
      if (dto.vehicleId !== undefined) data.vehicle = { connect: { id: vehicleId } };
      data.startDate = start;
      data.endDate = end;
    }
    if (dto.clientId !== undefined) {
      await this.clients.assertNotBlacklisted(tenantId, dto.clientId);
      data.client = { connect: { id: dto.clientId } };
    }
    if (dto.pickupLocation !== undefined) data.pickupLocation = dto.pickupLocation;
    if (dto.returnLocation !== undefined) data.returnLocation = dto.returnLocation;
    if (dto.dailyRate !== undefined) data.dailyRate = dto.dailyRate;
    if (dto.source !== undefined) data.source = dto.source;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === 'CANCELLED') data.cancelledAt = new Date();
    }

    await this.repo.update(tenantId, id, data);
    return this.get(tenantId, id);
  }

  async cancel(tenantId: string, id: string): Promise<Reservation> {
    return this.update(tenantId, id, { status: 'CANCELLED' });
  }
}
