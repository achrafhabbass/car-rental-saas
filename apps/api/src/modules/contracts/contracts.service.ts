import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, RentalContract } from '@prisma/client';

import {
  PaginatedResult,
  buildPagination,
  paginate,
} from '../../common/dto/pagination.dto';
import { AlertsService } from '../alerts/alerts.service';
import { PlanLimitService } from '../billing/plan-limit.service';
import { ClientsService } from '../clients/clients.service';
import { NotificationService } from '../mail/notification.service';
import { buildContractPdf } from './contract-pdf';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import { VehiclesService } from '../vehicles/vehicles.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ContractsRepository } from './contracts.repository';
import { CompleteContractDto } from './dto/complete-contract.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { ListContractsDto } from './dto/list-contracts.dto';

@Injectable()
export class ContractsService {
  constructor(
    private readonly repo: ContractsRepository,
    private readonly prisma: PrismaService,
    private readonly vehicles: VehiclesService,
    private readonly vehiclesRepo: VehiclesRepository,
    private readonly clients: ClientsService,
    private readonly alerts: AlertsService,
    private readonly notifications: NotificationService,
    private readonly planLimits: PlanLimitService,
  ) {}

  async list(
    tenantId: string,
    dto: ListContractsDto,
  ): Promise<PaginatedResult<RentalContract>> {
    const { skip, take, orderBy } = buildPagination(dto);
    const where: Prisma.RentalContractWhereInput = {};
    if (dto.status) where.status = dto.status;
    if (dto.vehicleId) where.vehicleId = dto.vehicleId;
    if (dto.clientId) where.clientId = dto.clientId;
    if (dto.search) {
      const q = dto.search;
      where.OR = [
        { contractNumber: { contains: q, mode: 'insensitive' } },
        { client: { fullName: { contains: q, mode: 'insensitive' } } },
        { vehicle: { registration: { contains: q, mode: 'insensitive' } } },
      ];
    }
    const [items, total] = await this.repo.list(tenantId, where, skip, take, orderBy);
    return paginate(items, total, dto);
  }

  async get(tenantId: string, id: string): Promise<RentalContract> {
    const c = await this.repo.findById(tenantId, id);
    if (!c) throw new NotFoundException(`Contract ${id} not found`);
    return c;
  }

  async create(
    tenantId: string,
    userId: string | null,
    dto: CreateContractDto,
  ): Promise<RentalContract> {
    await this.planLimits.enforce(tenantId, 'contracts');

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (!(end > start)) {
      throw new BadRequestException('endDate must be after startDate');
    }

    const vehicle = await this.vehicles.get(tenantId, dto.vehicleId);
    if (vehicle.status === 'MAINTENANCE' || vehicle.status === 'INACTIVE') {
      throw new ConflictException(
        `Vehicle ${vehicle.registration} is not available (status ${vehicle.status})`,
      );
    }
    if (
      vehicle.insuranceExpiry &&
      new Date(vehicle.insuranceExpiry).getTime() < end.getTime()
    ) {
      throw new ConflictException(
        `Vehicle ${vehicle.registration} insurance expires before contract end`,
      );
    }

    await this.clients.assertNotBlacklisted(tenantId, dto.clientId);

    // Business rule: refuse a contract on an unfit vehicle.
    const blockers = await this.alerts.getBookingBlockers(tenantId, vehicle.id);
    if (blockers.length > 0) {
      throw new ConflictException(
        `Vehicle ${vehicle.registration} is not bookable: ${blockers.join('; ')}`,
      );
    }

    // When converting from a reservation we must exclude that reservation
    // from the overlap check — otherwise it conflicts with itself.
    const overlap = await this.vehiclesRepo.hasOverlap(
      tenantId,
      vehicle.id,
      start,
      end,
      dto.reservationId,
      undefined,
    );
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
    const discount = dto.discountAmount ?? 0;
    const totalAmount = dailyRate * days - discount;

    const contractNumber = await this.repo.generateContractNumber(tenantId);

    const result = await this.prisma.$transaction(async (tx) => {
      const contract = await tx.rentalContract.create({
        data: {
          tenantId,
          contractNumber,
          vehicleId: dto.vehicleId,
          clientId: dto.clientId,
          reservationId: dto.reservationId,
          createdByUserId: userId,
          startDate: start,
          endDate: end,
          kmStart: dto.kmStart,
          kmAllowance: dto.kmAllowance,
          dailyRate,
          totalAmount,
          depositAmount: dto.depositAmount ?? 0,
          depositMethod: dto.depositMethod,
          depositReference: dto.depositReference,
          discountAmount: discount,
          pickupLocation: dto.pickupLocation,
          returnLocation: dto.returnLocation,
          additionalDriver: dto.additionalDriver,
          additionalDriverLicense: dto.additionalDriverLicense,
          notes: dto.notes,
          status: 'ACTIVE',
        },
      });

      await tx.vehicle.update({
        where: { id: vehicle.id },
        data: { status: 'RENTED' },
      });

      if (dto.reservationId) {
        await tx.reservation.updateMany({
          where: { id: dto.reservationId, tenantId },
          data: { status: 'CONVERTED', convertedAt: new Date() },
        });
      }

      return contract;
    });

    void this.notifications.onContractCreated(result.id);

    return result;
  }

  async complete(
    tenantId: string,
    id: string,
    dto: CompleteContractDto,
  ): Promise<RentalContract> {
    const contract = await this.get(tenantId, id);
    if (contract.status !== 'ACTIVE') {
      throw new ConflictException(
        `Only ACTIVE contracts can be completed (current: ${contract.status})`,
      );
    }
    if (dto.kmEnd < contract.kmStart) {
      throw new BadRequestException('kmEnd cannot be less than kmStart');
    }

    const actualReturn = dto.actualReturnDate ? new Date(dto.actualReturnDate) : new Date();
    const extra = dto.extraCharges ?? 0;

    return this.prisma.$transaction(async (tx) => {
      await tx.rentalContract.update({
        where: { id: contract.id },
        data: {
          status: 'COMPLETED',
          actualReturnDate: actualReturn,
          kmEnd: dto.kmEnd,
          extraCharges: extra,
          totalAmount: Number(contract.totalAmount) + Number(extra),
          notes: dto.notes ?? contract.notes,
        },
      });

      await tx.vehicle.update({
        where: { id: contract.vehicleId },
        data: {
          status: 'AVAILABLE',
          currentKm: dto.kmEnd,
        },
      });

      const fresh = await tx.rentalContract.findUniqueOrThrow({ where: { id: contract.id } });
      return fresh;
    });
  }

  async generatePdfStream(tenantId: string, id: string): Promise<NodeJS.ReadableStream> {
    const contract = await this.prisma.rentalContract.findFirst({
      where: { id, tenantId },
      include: { vehicle: true, client: true, tenant: true },
    });
    if (!contract) throw new NotFoundException(`Contract ${id} not found`);

    // Stamp the metadata so the UI can show "PDF generated on …"
    await this.prisma.rentalContract.update({
      where: { id: contract.id },
      data: {
        metadata: {
          ...((contract.metadata as Record<string, unknown> | null) ?? {}),
          lastPdfAt: new Date().toISOString(),
        },
      },
    });

    return buildContractPdf({
      tenant: {
        name: contract.tenant.name,
        phone: contract.tenant.phone,
        billingEmail: contract.tenant.billingEmail,
        address: contract.tenant.address,
        city: contract.tenant.city,
        website: contract.tenant.website,
        logoUrl: contract.tenant.logoUrl,
        taxId: contract.tenant.taxId,
        ice: contract.tenant.ice,
        rc: contract.tenant.rc,
        patente: contract.tenant.patente,
        cnss: contract.tenant.cnss,
        bankName: contract.tenant.bankName,
        bankRib: contract.tenant.bankRib,
      },
      contract: {
        contractNumber: contract.contractNumber,
        startDate: contract.startDate,
        endDate: contract.endDate,
        actualReturnDate: contract.actualReturnDate,
        kmStart: contract.kmStart,
        kmEnd: contract.kmEnd,
        kmAllowance: contract.kmAllowance,
        dailyRate: contract.dailyRate.toString(),
        totalAmount: contract.totalAmount.toString(),
        depositAmount: contract.depositAmount.toString(),
        depositMethod: contract.depositMethod,
        pickupLocation: contract.pickupLocation,
        returnLocation: contract.returnLocation,
        additionalDriver: contract.additionalDriver,
        notes: contract.notes,
        status: contract.status,
        createdAt: contract.createdAt,
      },
      vehicle: {
        registration: contract.vehicle.registration,
        brand: contract.vehicle.brand,
        model: contract.vehicle.model,
        year: contract.vehicle.year,
        color: contract.vehicle.color,
        vin: contract.vehicle.vin,
      },
      client: {
        fullName: contract.client.fullName,
        idNumber: contract.client.idNumber,
        idType: contract.client.idType,
        licenseNumber: contract.client.licenseNumber,
        phone: contract.client.phone,
        email: contract.client.email,
        addressLine1: contract.client.addressLine1,
        city: contract.client.city,
      },
    });
  }

  /**
   * Attach a client signature URL to the contract and stamp `signedAt`.
   * The URL must point at an asset already stored via POST /uploads — we
   * never receive the raw signature bytes here.
   *
   * Re-signing overwrites the previous URL and timestamp. Callers
   * expecting a single-shot flow should gate the UI on `!contract.signedAt`.
   */
  async sign(tenantId: string, id: string, signatureUrl: string): Promise<RentalContract> {
    const contract = await this.get(tenantId, id);
    if (contract.status === 'CANCELLED') {
      throw new ConflictException('Cannot sign a cancelled contract');
    }
    return this.prisma.rentalContract.update({
      where: { id: contract.id },
      data: { signatureUrl, signedAt: new Date() },
    });
  }

  async cancel(tenantId: string, id: string): Promise<RentalContract> {
    const contract = await this.get(tenantId, id);
    if (contract.status === 'COMPLETED') {
      throw new ConflictException('Cannot cancel a completed contract');
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.rentalContract.update({
        where: { id: contract.id },
        data: { status: 'CANCELLED' },
      });
      await tx.vehicle.update({
        where: { id: contract.vehicleId },
        data: { status: 'AVAILABLE' },
      });
      return tx.rentalContract.findUniqueOrThrow({ where: { id: contract.id } });
    });
  }
}
