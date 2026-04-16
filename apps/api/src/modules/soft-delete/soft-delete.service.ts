import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { PlatformAuditService } from '../platform/platform-audit.service';

export type SoftDeletableEntity = 'vehicle' | 'client' | 'contract' | 'invoice';

const ENTITY_MAP = {
  vehicle: 'vehicle',
  client: 'client',
  contract: 'rentalContract',
  invoice: 'invoice',
} as const;

const ENTITY_LABELS: Record<SoftDeletableEntity, string> = {
  vehicle: 'Véhicule',
  client: 'Client',
  contract: 'Contrat',
  invoice: 'Facture',
};

@Injectable()
export class SoftDeleteService {
  private readonly logger = new Logger(SoftDeleteService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PlatformAuditService,
  ) {}

  async softDelete(
    entity: SoftDeletableEntity,
    tenantId: string,
    id: string,
    actorUserId: string,
  ): Promise<void> {
    const model = ENTITY_MAP[entity];
    const record = await (this.prisma[model] as any).findFirst({
      where: { id, tenantId },
    });
    if (!record) throw new NotFoundException(`${ENTITY_LABELS[entity]} introuvable`);
    if (record.deletedAt) throw new BadRequestException('Déjà supprimé');

    await (this.prisma[model] as any).update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    void this.audit.record({
      action: 'ENTITY_SOFT_DELETE',
      actorUserId,
      tenantId,
      metadata: { entity, id, label: this.getLabel(entity, record) },
    });

    this.logger.log(`Soft-deleted ${entity} ${id} by ${actorUserId}`);
  }

  async restore(
    entity: SoftDeletableEntity,
    tenantId: string,
    id: string,
    actorUserId: string,
  ): Promise<void> {
    const model = ENTITY_MAP[entity];
    const record = await (this.prisma[model] as any).findFirst({
      where: { id, tenantId },
    });
    if (!record) throw new NotFoundException(`${ENTITY_LABELS[entity]} introuvable`);
    if (!record.deletedAt) throw new BadRequestException('Non supprimé — rien à restaurer');

    await (this.prisma[model] as any).update({
      where: { id },
      data: { deletedAt: null },
    });

    void this.audit.record({
      action: 'ENTITY_RESTORE',
      actorUserId,
      tenantId,
      metadata: { entity, id, label: this.getLabel(entity, record) },
    });

    this.logger.log(`Restored ${entity} ${id} by ${actorUserId}`);
  }

  async listDeleted(
    entity: SoftDeletableEntity,
    tenantId: string,
  ): Promise<Array<{ id: string; deletedAt: string; label: string }>> {
    const model = ENTITY_MAP[entity];
    const records = await (this.prisma[model] as any).findMany({
      where: { tenantId, deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
      take: 100,
    });
    return records.map((r: any) => ({
      id: r.id,
      deletedAt: r.deletedAt?.toISOString(),
      label: this.getLabel(entity, r),
    }));
  }

  private getLabel(entity: SoftDeletableEntity, record: any): string {
    switch (entity) {
      case 'vehicle':
        return `${record.brand ?? ''} ${record.model ?? ''} · ${record.registration ?? ''}`.trim();
      case 'client':
        return record.fullName ?? record.id;
      case 'contract':
        return record.contractNumber ?? record.id;
      case 'invoice':
        return record.invoiceNumber ?? record.id;
    }
  }
}
