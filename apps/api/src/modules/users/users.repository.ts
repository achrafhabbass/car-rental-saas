import { Injectable } from '@nestjs/common';
import type { Prisma, Tenant, User } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByIdAndTenant(
    tenantId: string,
    id: string,
    includeDeleted = false,
  ): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        id,
        tenantId,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
    });
  }

  findByEmail(email: string, tenantId?: string): Promise<User | null> {
    if (tenantId) {
      return this.prisma.user.findUnique({
        where: { tenant_email_unique: { tenantId, email: email.toLowerCase() } },
      });
    }
    return this.prisma.user.findFirst({ where: { email: email.toLowerCase() } });
  }

  findTenant(tenantId: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { id: tenantId } });
  }

  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  updateLastLogin(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  listByTenant(tenantId: string): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateProfile(
    id: string,
    data: Pick<Prisma.UserUpdateInput, 'firstName' | 'lastName'>,
  ): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  updatePasswordHash(id: string, passwordHash: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }
}
