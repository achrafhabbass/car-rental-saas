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

  async updateSelf(
    id: string,
    data: Partial<
      Record<
        | 'name'
        | 'phone'
        | 'billingEmail'
        | 'address'
        | 'city'
        | 'website'
        | 'logoUrl'
        | 'taxId'
        | 'ice'
        | 'rc'
        | 'patente'
        | 'cnss'
        | 'bankName'
        | 'bankRib',
        string
      >
    >,
  ): Promise<Tenant> {
    await this.getByIdOrFail(id);
    const patch: Record<string, string | null> = {};
    const nullable: Array<keyof typeof data> = [
      'phone',
      'billingEmail',
      'address',
      'city',
      'website',
      'logoUrl',
      'taxId',
      'ice',
      'rc',
      'patente',
      'cnss',
      'bankName',
      'bankRib',
    ];
    if (data.name !== undefined) patch.name = data.name;
    for (const k of nullable) {
      if (data[k] !== undefined) patch[k as string] = data[k] || null;
    }
    return this.repo.update(id, patch);
  }
}
