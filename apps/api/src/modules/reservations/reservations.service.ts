import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, Reservation, ReservationPaymentStatus } from '@prisma/client';

import {
  PaginatedResult,
  buildPagination,
  paginate,
} from '../../common/dto/pagination.dto';
import { AlertsService } from '../alerts/alerts.service';
import { ClientsService } from '../clients/clients.service';
import { NotificationService } from '../mail/notification.service';
import { ContractsService } from '../contracts/contracts.service';
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
    private readonly alerts: AlertsService,
    private readonly contractsService: ContractsService,
    private readonly notifications: NotificationService,
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
      const q = dto.search;
      where.OR = [
        { reservationCode: { contains: q, mode: 'insensitive' } },
        { client: { fullName: { contains: q, mode: 'insensitive' } } },
        { vehicle: { registration: { contains: q, mode: 'insensitive' } } },
      ];
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

    // Business rule: refuse a reservation when the vehicle is unfit.
    const blockers = await this.alerts.getBookingBlockers(tenantId, vehicle.id);
    if (blockers.length > 0) {
      throw new ConflictException(
        `Vehicle ${vehicle.registration} is not bookable: ${blockers.join('; ')}`,
      );
    }

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

    const reservation = await this.repo.create({
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
      paymentStatus: dto.paymentStatus ?? 'PENDING',
      notes: dto.notes,
    });

    void this.notifications.onReservationCreated(reservation.id);

    return reservation;
  }

  async updatePaymentStatus(
    tenantId: string,
    id: string,
    paymentStatus: ReservationPaymentStatus,
  ): Promise<Reservation> {
    await this.get(tenantId, id);
    await this.repo.update(tenantId, id, { paymentStatus });
    return this.get(tenantId, id);
  }

  /// Converts a non-cancelled / non-converted reservation into a fresh
  /// rental contract. The DB-level @unique on rental_contracts.reservationId
  /// guarantees one-to-one — service-layer check below provides a friendlier
  /// 409 with a clear message.
  async convertToContract(
    tenantId: string,
    id: string,
    userId: string | null,
    overrides: { kmStart: number; depositAmount?: number; depositMethod?: string } & {
      depositReference?: string;
    },
  ): Promise<{ contractId: string }> {
    const reservation = await this.get(tenantId, id);
    if (reservation.status === 'CANCELLED') {
      throw new ConflictException('Cannot convert a cancelled reservation');
    }
    if (reservation.status === 'CONVERTED') {
      throw new ConflictException('Reservation is already converted');
    }
    const existingContract = await this.repo.findContractForReservation(tenantId, id);
    if (existingContract) {
      throw new ConflictException(
        `Reservation already produced contract ${existingContract.contractNumber}`,
      );
    }

    const contract = await this.contractsService.create(tenantId, userId, {
      vehicleId: reservation.vehicleId,
      clientId: reservation.clientId,
      reservationId: reservation.id,
      startDate: reservation.startDate.toISOString(),
      endDate: reservation.endDate.toISOString(),
      kmStart: overrides.kmStart,
      dailyRate: Number(reservation.dailyRate),
      depositAmount: overrides.depositAmount,
      depositMethod: overrides.depositMethod as
        | 'CASH'
        | 'CHECK'
        | 'CARD'
        | 'CARD_IMPRINT'
        | 'BANK_TRANSFER'
        | undefined,
      depositReference: overrides.depositReference,
      pickupLocation: reservation.pickupLocation ?? undefined,
      returnLocation: reservation.returnLocation ?? undefined,
      notes: reservation.notes ?? undefined,
    });

    return { contractId: contract.id };
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
