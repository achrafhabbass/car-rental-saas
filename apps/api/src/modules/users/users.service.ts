import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';

import { UsersRepository } from './users.repository';

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
}
