import { Injectable } from '@nestjs/common';
import type { Notification, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

export interface CreateNotificationInput {
  tenantId: string;
  userId?: string | null;
  title: string;
  body: string;
  link?: string;
  alertId?: string;
  channel?: 'IN_APP' | 'EMAIL' | 'SMS';
  metadata?: Prisma.InputJsonValue;
}

/**
 * In-app notification service.
 *
 * The service-layer abstraction here lets us swap channels (email, SMS) later
 * without touching callers: any `create()` with `channel: 'EMAIL'` would be
 * routed through an email provider once wired. For now all channels persist
 * as rows — IN_APP is surfaced in the topbar bell.
 */
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateNotificationInput): Promise<Notification> {
    return this.prisma.notification.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId ?? null,
        title: input.title,
        body: input.body,
        link: input.link,
        alertId: input.alertId,
        channel: input.channel ?? 'IN_APP',
        metadata: input.metadata,
      },
    });
  }

  /// Fan-out: create the same notification for every ADMIN/MANAGER user in the
  /// tenant (typical default for auto-generated alert notifications).
  async broadcastToAdmins(input: Omit<CreateNotificationInput, 'userId'>): Promise<void> {
    const users = await this.prisma.user.findMany({
      where: {
        tenantId: input.tenantId,
        status: 'ACTIVE',
        deletedAt: null,
        role: { in: ['ADMIN', 'MANAGER'] },
      },
      select: { id: true },
    });
    if (users.length === 0) {
      // fallback: tenant-wide notification
      await this.create(input);
      return;
    }
    await this.prisma.notification.createMany({
      data: users.map((u) => ({
        tenantId: input.tenantId,
        userId: u.id,
        title: input.title,
        body: input.body,
        link: input.link,
        alertId: input.alertId,
        channel: input.channel ?? 'IN_APP',
      })),
    });
  }

  list(
    tenantId: string,
    userId: string,
    options: { status?: 'UNREAD' | 'READ' | 'ARCHIVED'; limit?: number } = {},
  ): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: {
        tenantId,
        OR: [{ userId }, { userId: null }],
        status: options.status,
      },
      orderBy: { createdAt: 'desc' },
      take: options.limit ?? 50,
    });
  }

  async summary(tenantId: string, userId: string): Promise<{ unread: number; total: number }> {
    const [unread, total] = await Promise.all([
      this.prisma.notification.count({
        where: {
          tenantId,
          OR: [{ userId }, { userId: null }],
          status: 'UNREAD',
        },
      }),
      this.prisma.notification.count({
        where: {
          tenantId,
          OR: [{ userId }, { userId: null }],
        },
      }),
    ]);
    return { unread, total };
  }

  async markRead(tenantId: string, userId: string, id: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id, tenantId, OR: [{ userId }, { userId: null }] },
      data: { status: 'READ', readAt: new Date() },
    });
  }

  async markAllRead(tenantId: string, userId: string): Promise<{ count: number }> {
    return this.prisma.notification.updateMany({
      where: {
        tenantId,
        OR: [{ userId }, { userId: null }],
        status: 'UNREAD',
      },
      data: { status: 'READ', readAt: new Date() },
    });
  }
}
