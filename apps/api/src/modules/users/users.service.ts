import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { UsersRepository } from './users.repository';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(private readonly repo: UsersRepository) {}

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
