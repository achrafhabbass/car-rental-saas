import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { User, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

import { NotificationService } from '../mail/notification.service';
import { BillingService } from '../billing/billing.service';
import { UsersRepository } from './users.repository';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    private readonly repo: UsersRepository,
    private readonly notifications: NotificationService,
    private readonly billing: BillingService,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.repo.findById(id);
  }

  findByEmail(email: string, tenantId?: string): Promise<User | null> {
    return this.repo.findByEmail(email, tenantId);
  }

  markLoggedIn(id: string): Promise<User> {
    return this.repo.updateLastLogin(id);
  }

  listForTenant(tenantId: string): Promise<User[]> {
    return this.repo.listByTenant(tenantId);
  }

  /**
   * Create a user within a tenant (invite flow).
   * If no password is provided, generates a temporary one.
   */
  async createForTenant(
    tenantId: string,
    dto: CreateUserDto,
  ): Promise<User & { tempPassword?: string }> {
    // Check plan limits
    const tenant = await this.repo.findTenant(tenantId);
    if (tenant) {
      const limitMsg = await this.billing.checkLimits(tenantId, tenant.plan, 'users');
      if (limitMsg) throw new ConflictException(limitMsg);
    }

    // Check email uniqueness within tenant
    const existing = await this.repo.findByEmail(dto.email, tenantId);
    if (existing) {
      throw new ConflictException(`Un utilisateur avec l'email ${dto.email} existe déjà`);
    }

    // Prevent creating SUPER_ADMIN from tenant context
    if (dto.role === 'SUPER_ADMIN') {
      throw new BadRequestException('Impossible de créer un SUPER_ADMIN depuis cette interface');
    }

    const tempPassword = dto.password || randomBytes(6).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

    const user = await this.repo.create({
      tenant: { connect: { id: tenantId } },
      email: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      status: 'INVITED',
    });

    // Return with temp password so caller can share it
    return Object.assign(user, dto.password ? {} : { tempPassword });
  }

  async updateUser(
    tenantId: string,
    userId: string,
    dto: UpdateUserDto,
  ): Promise<User> {
    const user = await this.repo.findByIdAndTenant(tenantId, userId);
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    if (user.role === 'SUPER_ADMIN') {
      throw new BadRequestException('Impossible de modifier un SUPER_ADMIN');
    }
    if (dto.role === 'SUPER_ADMIN') {
      throw new BadRequestException('Impossible d\'assigner le rôle SUPER_ADMIN');
    }

    return this.repo.update(userId, {
      ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
      ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
      ...(dto.role !== undefined ? { role: dto.role } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
    });
  }

  async softDeleteUser(tenantId: string, userId: string): Promise<void> {
    const user = await this.repo.findByIdAndTenant(tenantId, userId);
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    if (user.role === 'SUPER_ADMIN') {
      throw new BadRequestException('Impossible de supprimer un SUPER_ADMIN');
    }
    await this.repo.update(userId, { deletedAt: new Date() });
  }

  async restoreUser(tenantId: string, userId: string): Promise<User> {
    const user = await this.repo.findByIdAndTenant(tenantId, userId, true);
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    if (!user.deletedAt) throw new BadRequestException('Utilisateur non supprimé');
    return this.repo.update(userId, { deletedAt: null });
  }

  async resetPassword(tenantId: string, userId: string): Promise<string> {
    const user = await this.repo.findByIdAndTenant(tenantId, userId);
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    const newPassword = randomBytes(6).toString('hex');
    const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.repo.updatePasswordHash(userId, hash);
    return newPassword;
  }

  // Existing self-service methods

  updateProfile(
    id: string,
    data: { firstName?: string; lastName?: string },
  ): Promise<User> {
    const patch: { firstName?: string; lastName?: string } = {};
    if (data.firstName !== undefined) patch.firstName = data.firstName;
    if (data.lastName !== undefined) patch.lastName = data.lastName;
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('No fields to update');
    }
    return this.repo.updateProfile(id, patch);
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.repo.findById(id);
    if (!user) throw new UnauthorizedException('User not found');
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Current password is incorrect');
    const same = await bcrypt.compare(newPassword, user.passwordHash);
    if (same) {
      throw new BadRequestException('New password must differ from current password');
    }
    const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.repo.updatePasswordHash(id, hash);
  }
}
