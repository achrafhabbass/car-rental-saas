import { Injectable, NotFoundException } from '@nestjs/common';
import type { Tenant } from '@prisma/client';

import { TenantsRepository } from './tenants.repository';

@Injectable()
export class TenantsService {
  constructor(private readonly repo: TenantsRepository) {}

  findById(id: string): Promise<Tenant | null> {
    return this.repo.findById(id);
  }

  findBySlug(slug: string): Promise<Tenant | null> {
    return this.repo.findBySlug(slug);
  }

  async getByIdOrFail(id: string): Promise<Tenant> {
    const tenant = await this.repo.findById(id);
    if (!tenant) throw new NotFoundException(`Tenant ${id} not found`);
    return tenant;
  }
}
