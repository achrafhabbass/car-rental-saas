import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type VehicleInspection } from '@prisma/client';

import {
  PaginatedResult,
  buildPagination,
  paginate,
} from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { ListInspectionsDto } from './dto/list-inspections.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';

@Injectable()
export class InspectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    tenantId: string,
    dto: ListInspectionsDto,
  ): Promise<PaginatedResult<VehicleInspection>> {
    const { skip, take, orderBy } = buildPagination(dto);
    const where: Prisma.VehicleInspectionWhereInput = { tenantId };
    if (dto.contractId) where.contractId = dto.contractId;
    if (dto.vehicleId) where.vehicleId = dto.vehicleId;
    if (dto.type) where.type = dto.type;

    const [items, total] = await Promise.all([
      this.prisma.vehicleInspection.findMany({
        where,
        skip,
        take,
        orderBy: orderBy ?? { performedAt: 'desc' },
        include: {
          vehicle: { select: { registration: true, brand: true, model: true } },
          contract: { select: { contractNumber: true } },
        },
      }),
      this.prisma.vehicleInspection.count({ where }),
    ]);
    return paginate(items, total, dto);
  }

  async get(tenantId: string, id: string): Promise<VehicleInspection> {
    const i = await this.prisma.vehicleInspection.findFirst({
      where: { id, tenantId },
      include: {
        vehicle: { select: { registration: true, brand: true, model: true } },
        contract: { select: { contractNumber: true } },
      },
    });
    if (!i) throw new NotFoundException(`Inspection ${id} not found`);
    return i;
  }

  async create(tenantId: string, dto: CreateInspectionDto): Promise<VehicleInspection> {
    const contract = await this.prisma.rentalContract.findFirst({
      where: { id: dto.contractId, tenantId },
      select: { id: true, vehicleId: true },
    });
    if (!contract) throw new NotFoundException(`Contract ${dto.contractId} not found`);

    try {
      return await this.prisma.vehicleInspection.create({
        data: {
          tenantId,
          vehicleId: contract.vehicleId,
          contractId: dto.contractId,
          type: dto.type,
          status: dto.status ?? 'COMPLETED',
          performedAt: dto.performedAt ? new Date(dto.performedAt) : new Date(),
          km: dto.km,
          fuelLevel: dto.fuelLevel ?? 'FULL',
          condition: dto.condition ?? 'GOOD',
          damages: dto.damages,
          photos: dto.photos ?? [],
          agentName: dto.agentName,
          signatureUrl: dto.signatureUrl,
          notes: dto.notes,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          `Contract ${dto.contractId} already has a ${dto.type} inspection`,
        );
      }
      throw err;
    }
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateInspectionDto,
  ): Promise<VehicleInspection> {
    await this.get(tenantId, id);
    const data: Prisma.VehicleInspectionUpdateInput = {};
    if (dto.performedAt !== undefined) data.performedAt = new Date(dto.performedAt);
    if (dto.km !== undefined) data.km = dto.km;
    if (dto.fuelLevel !== undefined) data.fuelLevel = dto.fuelLevel;
    if (dto.condition !== undefined) data.condition = dto.condition;
    if (dto.damages !== undefined) data.damages = dto.damages;
    if (dto.photos !== undefined) data.photos = dto.photos;
    if (dto.agentName !== undefined) data.agentName = dto.agentName;
    if (dto.signatureUrl !== undefined) data.signatureUrl = dto.signatureUrl;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.status !== undefined) data.status = dto.status;

    await this.prisma.vehicleInspection.updateMany({
      where: { id, tenantId },
      data,
    });
    return this.get(tenantId, id);
  }

  /// Convenience: list both inspections (DEPARTURE + RETURN) for a contract.
  async listForContract(
    tenantId: string,
    contractId: string,
  ): Promise<VehicleInspection[]> {
    return this.prisma.vehicleInspection.findMany({
      where: { tenantId, contractId },
      orderBy: { type: 'asc' },
    });
  }
}
