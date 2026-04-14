import { AlertsService } from './alerts.service';

type MockFn = jest.Mock;
interface MockPrisma {
  vehicle: { findFirst: MockFn };
  maintenanceSchedule: { findMany: MockFn };
  alert: {
    findFirst: MockFn;
    create: MockFn;
    update: MockFn;
    updateMany: MockFn;
    count: MockFn;
    groupBy: MockFn;
    findMany: MockFn;
  };
  invoice: { findFirst: MockFn };
  vehicleCredit: { findFirst: MockFn };
  vehicleCreditPayment: { findFirst: MockFn };
}

function makePrismaMock(): MockPrisma {
  return {
    vehicle: { findFirst: jest.fn() },
    maintenanceSchedule: { findMany: jest.fn().mockResolvedValue([]) },
    alert: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    invoice: { findFirst: jest.fn() },
    vehicleCredit: { findFirst: jest.fn() },
    vehicleCreditPayment: { findFirst: jest.fn() },
  };
}

function makeNotificationsMock() {
  return {
    broadcastToAdmins: jest.fn().mockResolvedValue(undefined),
    create: jest.fn(),
  };
}

const TENANT = '00000000-0000-0000-0000-000000000001';
const VEHICLE = '00000000-0000-0000-0000-0000000000aa';

function baseVehicle(overrides: Record<string, unknown> = {}) {
  return {
    id: VEHICLE,
    tenantId: TENANT,
    registration: '12345-A-1',
    brand: 'Renault',
    model: 'Clio',
    status: 'AVAILABLE',
    currentKm: 10_000,
    insuranceExpiry: null as Date | null,
    technicalVisitExpiry: null as Date | null,
    vignetteExpiry: null as Date | null,
    deletedAt: null,
    ...overrides,
  };
}

describe('AlertsService', () => {
  describe('getBookingBlockers', () => {
    it('returns empty when vehicle is healthy', async () => {
      const prisma = makePrismaMock();
      prisma.vehicle.findFirst.mockResolvedValue(baseVehicle());
      prisma.maintenanceSchedule.findMany.mockResolvedValue([]);
      const svc = new AlertsService(prisma as never, makeNotificationsMock() as never);

      const blockers = await svc.getBookingBlockers(TENANT, VEHICLE);
      expect(blockers).toEqual([]);
    });

    it('blocks on expired insurance', async () => {
      const prisma = makePrismaMock();
      prisma.vehicle.findFirst.mockResolvedValue(
        baseVehicle({ insuranceExpiry: new Date('2020-01-01Z') }),
      );
      const svc = new AlertsService(prisma as never, makeNotificationsMock() as never);

      const blockers = await svc.getBookingBlockers(TENANT, VEHICLE);
      expect(blockers.length).toBeGreaterThan(0);
      expect(blockers[0]).toMatch(/Insurance expired/);
    });

    it('blocks on expired technical visit', async () => {
      const prisma = makePrismaMock();
      prisma.vehicle.findFirst.mockResolvedValue(
        baseVehicle({ technicalVisitExpiry: new Date('2020-01-01Z') }),
      );
      const svc = new AlertsService(prisma as never, makeNotificationsMock() as never);

      const blockers = await svc.getBookingBlockers(TENANT, VEHICLE);
      expect(blockers.some((b) => /Technical visit expired/.test(b))).toBe(true);
    });

    it('blocks on critical overdue maintenance', async () => {
      const prisma = makePrismaMock();
      prisma.vehicle.findFirst.mockResolvedValue(baseVehicle());
      prisma.maintenanceSchedule.findMany.mockResolvedValue([
        { id: 's1', title: 'Distribution belt', isCritical: true },
      ]);
      const svc = new AlertsService(prisma as never, makeNotificationsMock() as never);

      const blockers = await svc.getBookingBlockers(TENANT, VEHICLE);
      expect(blockers.some((b) => b.includes('Distribution belt'))).toBe(true);
    });

    it('flags non-existent vehicle', async () => {
      const prisma = makePrismaMock();
      prisma.vehicle.findFirst.mockResolvedValue(null);
      const svc = new AlertsService(prisma as never, makeNotificationsMock() as never);

      const blockers = await svc.getBookingBlockers(TENANT, 'bogus');
      expect(blockers).toEqual([`Vehicle bogus not found`]);
    });
  });

  describe('alert upsert (via syncVehicleAlerts → upsertAlert)', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24);

    it('creates a notification only on first CRITICAL alert (not on resync)', async () => {
      const prisma = makePrismaMock();
      const notifications = makeNotificationsMock();
      prisma.vehicle.findFirst.mockResolvedValue(
        baseVehicle({ insuranceExpiry: past }),
      );
      prisma.maintenanceSchedule.findMany.mockResolvedValue([]);

      // First sync: no existing alert → service creates one + notifies
      prisma.alert.findFirst.mockResolvedValueOnce(null);
      prisma.alert.create.mockResolvedValueOnce({ id: 'a1' });

      const svc = new AlertsService(prisma as never, notifications as never);
      await svc.syncVehicleAlerts(TENANT, VEHICLE);

      expect(prisma.alert.create).toHaveBeenCalledTimes(1);
      expect(notifications.broadcastToAdmins).toHaveBeenCalledTimes(1);

      // Second sync: alert already open → update only, no new notification
      prisma.alert.findFirst.mockResolvedValueOnce({ id: 'a1' });
      prisma.alert.update.mockResolvedValueOnce({ id: 'a1' });

      await svc.syncVehicleAlerts(TENANT, VEHICLE);
      expect(prisma.alert.create).toHaveBeenCalledTimes(1); // still 1
      expect(notifications.broadcastToAdmins).toHaveBeenCalledTimes(1);
      expect(prisma.alert.update).toHaveBeenCalledTimes(1);
    });

    it('resolves the alert when the condition disappears', async () => {
      const prisma = makePrismaMock();
      prisma.vehicle.findFirst.mockResolvedValue(
        baseVehicle({ insuranceExpiry: future }), // plenty of time
      );
      prisma.maintenanceSchedule.findMany.mockResolvedValue([]);
      const svc = new AlertsService(prisma as never, makeNotificationsMock() as never);

      await svc.syncVehicleAlerts(TENANT, VEHICLE);
      expect(prisma.alert.updateMany).toHaveBeenCalled();
      // At least one updateMany sets status → RESOLVED
      const resolveCall = prisma.alert.updateMany.mock.calls.find(
        ([args]) => args.data?.status === 'RESOLVED',
      );
      expect(resolveCall).toBeDefined();
    });
  });
});
