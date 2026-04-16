import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { csvEscape } from './csv';

const DAY_MS = 24 * 60 * 60 * 1000;

type Granularity = 'day' | 'week' | 'month';

export interface DashboardKpis {
  fleet: { total: number; available: number; rented: number; maintenance: number };
  contracts: { active: number; draft: number; completedThisMonth: number };
  revenue: { thisMonth: number; lastMonth: number; deltaPct: number | null };
  outstanding: { total: number; overdueCount: number };
  maintenance: { openAlerts: number; criticalAlerts: number };
  occupancy: { rateLast30d: number };
}

export interface RevenuePoint {
  date: string; // ISO yyyy-mm-dd for day, yyyy-mm for month
  revenue: number;
  payments: number;
}

export interface VehiclePerformance {
  vehicleId: string;
  registration: string;
  brand: string;
  model: string;
  totalRevenue: number;
  contractCount: number;
  maintenanceCost: number;
  net: number;
}

export interface ClientPerformance {
  clientId: string;
  fullName: string;
  contractCount: number;
  totalSpent: number;
  lastContractAt: string | null;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // -------- Dashboard KPIs --------

  async getDashboardKpis(tenantId: string): Promise<DashboardKpis> {
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const startOfLastMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
    );

    const [
      fleetTotal,
      fleetAvailable,
      fleetRented,
      fleetMaintenance,
      contractsActive,
      contractsDraft,
      contractsCompletedThisMonth,
      revenueThisMonth,
      revenueLastMonth,
      outstanding,
      overdueCount,
      openAlerts,
      criticalAlerts,
      occupancy,
    ] = await Promise.all([
      this.prisma.vehicle.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.vehicle.count({
        where: { tenantId, deletedAt: null, status: 'AVAILABLE' },
      }),
      this.prisma.vehicle.count({
        where: { tenantId, deletedAt: null, status: 'RENTED' },
      }),
      this.prisma.vehicle.count({
        where: { tenantId, deletedAt: null, status: 'MAINTENANCE' },
      }),
      this.prisma.rentalContract.count({ where: { tenantId, status: 'ACTIVE' } }),
      this.prisma.rentalContract.count({ where: { tenantId, status: 'DRAFT' } }),
      this.prisma.rentalContract.count({
        where: {
          tenantId,
          status: 'COMPLETED',
          actualReturnDate: { gte: startOfMonth },
        },
      }),
      this.prisma.payment.aggregate({
        where: {
          tenantId,
          status: 'CONFIRMED',
          paidAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          tenantId,
          status: 'CONFIRMED',
          paidAt: { gte: startOfLastMonth, lt: startOfMonth },
        },
        _sum: { amount: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          tenantId,
          status: { in: ['ISSUED', 'PARTIAL', 'OVERDUE'] },
        },
        _sum: { balance: true },
      }),
      this.prisma.invoice.count({
        where: {
          tenantId,
          status: { in: ['OVERDUE'] },
        },
      }),
      this.prisma.alert.count({ where: { tenantId, status: 'OPEN' } }),
      this.prisma.alert.count({
        where: { tenantId, status: 'OPEN', severity: 'CRITICAL' },
      }),
      this.computeOccupancyRate(tenantId, 30),
    ]);

    const thisMonth = Number(revenueThisMonth._sum.amount ?? 0);
    const lastMonth = Number(revenueLastMonth._sum.amount ?? 0);
    const deltaPct = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : null;

    return {
      fleet: {
        total: fleetTotal,
        available: fleetAvailable,
        rented: fleetRented,
        maintenance: fleetMaintenance,
      },
      contracts: {
        active: contractsActive,
        draft: contractsDraft,
        completedThisMonth: contractsCompletedThisMonth,
      },
      revenue: { thisMonth, lastMonth, deltaPct },
      outstanding: {
        total: Number(outstanding._sum.balance ?? 0),
        overdueCount,
      },
      maintenance: { openAlerts, criticalAlerts },
      occupancy,
    };
  }

  /// Fleet occupancy = rented days / (fleet size × window days).
  /// Caps per-contract days to the overlap with the window to handle partial
  /// overlaps at boundaries (contract spans past the window, etc.).
  private async computeOccupancyRate(
    tenantId: string,
    windowDays: number,
  ): Promise<{ rateLast30d: number }> {
    const windowEnd = new Date();
    const windowStart = new Date(windowEnd.getTime() - windowDays * DAY_MS);

    const [fleetSize, contracts] = await Promise.all([
      this.prisma.vehicle.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.rentalContract.findMany({
        where: {
          tenantId,
          status: { in: ['ACTIVE', 'COMPLETED'] },
          AND: [
            { startDate: { lt: windowEnd } },
            {
              OR: [
                { actualReturnDate: null, endDate: { gt: windowStart } },
                { actualReturnDate: { gt: windowStart } },
              ],
            },
          ],
        },
        select: { startDate: true, endDate: true, actualReturnDate: true },
      }),
    ]);

    if (fleetSize === 0) return { rateLast30d: 0 };

    let occupiedMs = 0;
    for (const c of contracts) {
      const start = Math.max(c.startDate.getTime(), windowStart.getTime());
      const endRaw = c.actualReturnDate ?? c.endDate;
      const end = Math.min(endRaw.getTime(), windowEnd.getTime());
      if (end > start) occupiedMs += end - start;
    }

    const availableMs = fleetSize * windowDays * DAY_MS;
    const rate = availableMs > 0 ? (occupiedMs / availableMs) * 100 : 0;
    return { rateLast30d: Math.round(rate * 10) / 10 };
  }

  // -------- Revenue series --------

  async getRevenueSeries(
    tenantId: string,
    windowDays = 30,
    granularity: Granularity = 'day',
  ): Promise<RevenuePoint[]> {
    const to = new Date();
    const from = new Date(to.getTime() - windowDays * DAY_MS);

    const payments = await this.prisma.payment.findMany({
      where: {
        tenantId,
        status: 'CONFIRMED',
        paidAt: { gte: from, lte: to },
      },
      select: { amount: true, paidAt: true },
    });

    const buckets = new Map<string, { revenue: number; payments: number }>();
    const keyOf = (d: Date): string => {
      if (granularity === 'month') {
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      }
      if (granularity === 'week') {
        // ISO week (year-week)
        const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
        const day = tmp.getUTCDay() || 7;
        tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
        const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
        const week = Math.ceil(
          ((tmp.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7,
        );
        return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
      }
      return d.toISOString().slice(0, 10);
    };

    // Seed zero buckets so gaps render as 0 in the chart
    const step = granularity === 'month' ? 30 : granularity === 'week' ? 7 : 1;
    for (let t = from.getTime(); t <= to.getTime(); t += step * DAY_MS) {
      buckets.set(keyOf(new Date(t)), { revenue: 0, payments: 0 });
    }

    for (const p of payments) {
      const k = keyOf(p.paidAt);
      const b = buckets.get(k) ?? { revenue: 0, payments: 0 };
      b.revenue += Number(p.amount);
      b.payments += 1;
      buckets.set(k, b);
    }

    return Array.from(buckets.entries())
      .map(([date, v]) => ({ date, revenue: v.revenue, payments: v.payments }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  // -------- Reservations series --------

  async getReservationsSeries(
    tenantId: string,
    weeks = 12,
  ): Promise<Array<{ week: string; count: number }>> {
    const now = new Date();
    const from = new Date(now.getTime() - weeks * 7 * DAY_MS);

    const reservations = await this.prisma.reservation.findMany({
      where: { tenantId, createdAt: { gte: from } },
      select: { createdAt: true },
    });

    const buckets = new Map<string, number>();
    // Seed weeks
    for (let i = 0; i < weeks; i++) {
      const d = new Date(now.getTime() - (weeks - 1 - i) * 7 * DAY_MS);
      const key = this.isoWeek(d);
      if (!buckets.has(key)) buckets.set(key, 0);
    }

    for (const r of reservations) {
      const key = this.isoWeek(r.createdAt);
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    return Array.from(buckets.entries())
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => (a.week < b.week ? -1 : 1));
  }

  private isoWeek(d: Date): string {
    const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const day = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
    return `S${String(week).padStart(2, '0')}`;
  }

  // -------- Fleet performance --------

  async getVehiclePerformance(
    tenantId: string,
    limit = 10,
  ): Promise<VehiclePerformance[]> {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true, registration: true, brand: true, model: true },
    });
    if (vehicles.length === 0) return [];

    const [contractAgg, maintenanceAgg, contractCounts] = await Promise.all([
      this.prisma.rentalContract.groupBy({
        by: ['vehicleId'],
        where: { tenantId, status: { in: ['ACTIVE', 'COMPLETED'] } },
        _sum: { totalAmount: true },
      }),
      this.prisma.maintenanceRecord.groupBy({
        by: ['vehicleId'],
        where: { tenantId },
        _sum: { cost: true },
      }),
      this.prisma.rentalContract.groupBy({
        by: ['vehicleId'],
        where: { tenantId },
        _count: { _all: true },
      }),
    ]);

    const revenueById = new Map(
      contractAgg.map((c) => [c.vehicleId, Number(c._sum.totalAmount ?? 0)]),
    );
    const maintById = new Map(
      maintenanceAgg.map((m) => [m.vehicleId, Number(m._sum.cost ?? 0)]),
    );
    const countById = new Map(
      contractCounts.map((c) => [c.vehicleId, c._count._all]),
    );

    return vehicles
      .map<VehiclePerformance>((v) => {
        const revenue = revenueById.get(v.id) ?? 0;
        const maint = maintById.get(v.id) ?? 0;
        return {
          vehicleId: v.id,
          registration: v.registration,
          brand: v.brand,
          model: v.model,
          totalRevenue: revenue,
          contractCount: countById.get(v.id) ?? 0,
          maintenanceCost: maint,
          net: revenue - maint,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  }

  // -------- Client performance --------

  async getTopClients(tenantId: string, limit = 10): Promise<ClientPerformance[]> {
    const agg = await this.prisma.rentalContract.groupBy({
      by: ['clientId'],
      where: { tenantId, status: { in: ['ACTIVE', 'COMPLETED'] } },
      _sum: { totalAmount: true },
      _count: { _all: true },
      _max: { createdAt: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: limit,
    });
    if (agg.length === 0) return [];

    const ids = agg.map((a) => a.clientId);
    const clients = await this.prisma.client.findMany({
      where: { tenantId, id: { in: ids } },
      select: { id: true, fullName: true },
    });
    const byId = new Map(clients.map((c) => [c.id, c.fullName]));

    return agg.map<ClientPerformance>((a) => ({
      clientId: a.clientId,
      fullName: byId.get(a.clientId) ?? 'Inconnu',
      contractCount: a._count._all,
      totalSpent: Number(a._sum.totalAmount ?? 0),
      lastContractAt: a._max.createdAt?.toISOString() ?? null,
    }));
  }

  // -------- CSV Exports --------

  async exportContractsCsv(tenantId: string): Promise<string> {
    const rows = await this.prisma.rentalContract.findMany({
      where: { tenantId },
      include: {
        vehicle: { select: { registration: true, brand: true, model: true } },
        client: { select: { fullName: true, idNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'contractNumber',
      'status',
      'vehicle',
      'registration',
      'client',
      'clientId',
      'startDate',
      'endDate',
      'actualReturnDate',
      'kmStart',
      'kmEnd',
      'dailyRate',
      'totalAmount',
      'depositAmount',
      'extraCharges',
      'createdAt',
    ];

    const lines = [headers.join(',')];
    for (const c of rows) {
      lines.push(
        [
          csvEscape(c.contractNumber),
          c.status,
          csvEscape(`${c.vehicle.brand} ${c.vehicle.model}`),
          csvEscape(c.vehicle.registration),
          csvEscape(c.client.fullName),
          csvEscape(c.client.idNumber),
          c.startDate.toISOString(),
          c.endDate.toISOString(),
          c.actualReturnDate?.toISOString() ?? '',
          String(c.kmStart),
          c.kmEnd !== null ? String(c.kmEnd) : '',
          Number(c.dailyRate).toFixed(2),
          Number(c.totalAmount).toFixed(2),
          Number(c.depositAmount).toFixed(2),
          Number(c.extraCharges).toFixed(2),
          c.createdAt.toISOString(),
        ].join(','),
      );
    }
    return lines.join('\n');
  }

  async exportInvoicesCsv(tenantId: string): Promise<string> {
    const rows = await this.prisma.invoice.findMany({
      where: { tenantId },
      include: { client: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const headers = [
      'invoiceNumber',
      'status',
      'client',
      'issueDate',
      'dueDate',
      'subtotal',
      'taxAmount',
      'total',
      'amountPaid',
      'balance',
    ];
    const lines = [headers.join(',')];
    for (const i of rows) {
      lines.push(
        [
          csvEscape(i.invoiceNumber),
          i.status,
          csvEscape(i.client.fullName),
          i.issueDate.toISOString().slice(0, 10),
          i.dueDate?.toISOString().slice(0, 10) ?? '',
          Number(i.subtotal).toFixed(2),
          Number(i.taxAmount).toFixed(2),
          Number(i.total).toFixed(2),
          Number(i.amountPaid).toFixed(2),
          Number(i.balance).toFixed(2),
        ].join(','),
      );
    }
    return lines.join('\n');
  }

  async exportPaymentsCsv(tenantId: string): Promise<string> {
    const rows = await this.prisma.payment.findMany({
      where: { tenantId },
      include: {
        client: { select: { fullName: true } },
        invoice: { select: { invoiceNumber: true } },
        contract: { select: { contractNumber: true } },
      },
      orderBy: { paidAt: 'desc' },
    });
    const headers = [
      'paymentCode',
      'status',
      'method',
      'amount',
      'client',
      'invoice',
      'contract',
      'reference',
      'paidAt',
    ];
    const lines = [headers.join(',')];
    for (const p of rows) {
      lines.push(
        [
          csvEscape(p.paymentCode),
          p.status,
          p.method,
          Number(p.amount).toFixed(2),
          csvEscape(p.client.fullName),
          csvEscape(p.invoice?.invoiceNumber ?? ''),
          csvEscape(p.contract?.contractNumber ?? ''),
          csvEscape(p.reference ?? ''),
          p.paidAt.toISOString(),
        ].join(','),
      );
    }
    return lines.join('\n');
  }
}
