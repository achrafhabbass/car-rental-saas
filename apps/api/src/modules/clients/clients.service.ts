import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Client, Prisma } from '@prisma/client';

import {
  PaginatedResult,
  buildPagination,
  paginate,
} from '../../common/dto/pagination.dto';
import { ClientsRepository } from './clients.repository';
import { CreateClientDto } from './dto/create-client.dto';
import { ListClientsDto } from './dto/list-clients.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly repo: ClientsRepository) {}

  async list(tenantId: string, dto: ListClientsDto): Promise<PaginatedResult<Client>> {
    const { skip, take, orderBy } = buildPagination(dto);
    const where: Prisma.ClientWhereInput = {};
    if (dto.type) where.type = dto.type;
    if (dto.segment) where.segment = dto.segment;
    if (dto.blacklisted !== undefined) where.blacklisted = dto.blacklisted;
    if (dto.search) {
      where.OR = [
        { fullName: { contains: dto.search, mode: 'insensitive' } },
        { companyName: { contains: dto.search, mode: 'insensitive' } },
        { idNumber: { contains: dto.search, mode: 'insensitive' } },
        { email: { contains: dto.search, mode: 'insensitive' } },
        { phone: { contains: dto.search, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await this.repo.list(tenantId, where, skip, take, orderBy);
    return paginate(items, total, dto);
  }

  async get(tenantId: string, id: string): Promise<Client> {
    const c = await this.repo.findById(tenantId, id);
    if (!c) throw new NotFoundException(`Client ${id} not found`);
    return c;
  }

  async create(tenantId: string, dto: CreateClientDto): Promise<Client> {
    const existing = await this.repo.findByIdNumber(tenantId, dto.idNumber);
    if (existing) {
      throw new ConflictException(
        `Client with ID number ${dto.idNumber} already exists`,
      );
    }
    return this.repo.create({
      tenantId,
      type: dto.type ?? 'INDIVIDUAL',
      fullName: dto.fullName,
      companyName: dto.companyName,
      idNumber: dto.idNumber,
      idType: dto.idType,
      licenseNumber: dto.licenseNumber,
      licenseExpiry: dto.licenseExpiry ? new Date(dto.licenseExpiry) : undefined,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      nationality: dto.nationality,
      phone: dto.phone,
      email: dto.email?.toLowerCase(),
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2,
      city: dto.city,
      country: dto.country,
      segment: dto.segment ?? 'REGULAR',
      notes: dto.notes,
    });
  }

  async update(tenantId: string, id: string, dto: UpdateClientDto): Promise<Client> {
    await this.get(tenantId, id);

    const data: Prisma.ClientUpdateInput = {};
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    if (dto.companyName !== undefined) data.companyName = dto.companyName;
    if (dto.idNumber !== undefined) data.idNumber = dto.idNumber;
    if (dto.idType !== undefined) data.idType = dto.idType;
    if (dto.licenseNumber !== undefined) data.licenseNumber = dto.licenseNumber;
    if (dto.licenseExpiry !== undefined)
      data.licenseExpiry = new Date(dto.licenseExpiry);
    if (dto.dateOfBirth !== undefined) data.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.nationality !== undefined) data.nationality = dto.nationality;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.email !== undefined) data.email = dto.email.toLowerCase();
    if (dto.addressLine1 !== undefined) data.addressLine1 = dto.addressLine1;
    if (dto.addressLine2 !== undefined) data.addressLine2 = dto.addressLine2;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.country !== undefined) data.country = dto.country;
    if (dto.segment !== undefined) data.segment = dto.segment;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.blacklisted !== undefined) data.blacklisted = dto.blacklisted;
    if (dto.blacklistReason !== undefined) data.blacklistReason = dto.blacklistReason;
    if (dto.rating !== undefined) data.rating = dto.rating;

    await this.repo.update(tenantId, id, data);
    return this.get(tenantId, id);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.get(tenantId, id);
    await this.repo.softDelete(tenantId, id);
  }

  async assertNotBlacklisted(tenantId: string, id: string): Promise<Client> {
    const c = await this.get(tenantId, id);
    if (c.blacklisted) {
      throw new ConflictException(
        `Client ${c.fullName} is blacklisted: ${c.blacklistReason ?? 'no reason'}`,
      );
    }
    return c;
  }
}
