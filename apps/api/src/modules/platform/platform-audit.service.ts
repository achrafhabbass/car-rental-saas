import { Injectable, Logger } from '@nestjs/common';
import { Prisma, type PlatformAuditAction, type PlatformAuditLog } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

export interface RecordAuditInput {
  action: PlatformAuditAction;
  actorUserId?: string | null;
  tenantId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface ListAuditQuery {
  action?: PlatformAuditAction;
  actorUserId?: string;
  tenantId?: string;
  limit?: number;
}

@Injectable()
export class PlatformAuditService {
  private readonly logger = new Logger(PlatformAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /// Records one platform-level action. Never throws — audit failures must
  /// not break the main flow. Any error is logged and swallowed.
  async record(input: RecordAuditInput): Promise<void> {
    try {
      await this.prisma.platformAuditLog.create({
        data: {
          action: input.action,
          actorUserId: input.actorUserId ?? null,
          tenantId: input.tenantId ?? null,
          metadata: input.metadata,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to record audit event ${input.action}: ${(err as Error).message}`,
      );
    }
  }

  async list(q: ListAuditQuery = {}): Promise<PlatformAuditLog[]> {
    return this.prisma.platformAuditLog.findMany({
      where: {
        action: q.action,
        actorUserId: q.actorUserId,
        tenantId: q.tenantId,
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(q.limit ?? 100, 1), 500),
    });
  }
}
