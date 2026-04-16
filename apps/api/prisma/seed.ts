/* eslint-disable no-console */
import { PrismaClient, TenantStatus, TenantPlan, UserRole, UserStatus, VehicleStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create test tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'test-agency' },
    update: {},
    create: {
      name: 'Test Agency',
      slug: 'test-agency',
      status: TenantStatus.ACTIVE,
      plan: TenantPlan.BUSINESS,
      billingEmail: 'admin@test.com',
      phone: '+212 600 000 000',
      address: '123 Avenue Hassan II',
      city: 'Casablanca',
      country: 'MA',
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`Tenant: ${tenant.name} (${tenant.id})`);

  // 2. Create admin user
  const passwordHash = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { tenant_email_unique: { tenantId: tenant.id, email: 'admin@test.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@test.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Test',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
  console.log(`Admin user: ${admin.email} (${admin.id})`);

  // 3. Create 3 test vehicles
  const vehicles = [
    { registration: 'AB-123-CD', brand: 'Peugeot', model: '208', year: 2024, color: 'Blanc', dailyRate: 350, fuel: 'PETROL' as const, transmission: 'MANUAL' as const, seats: 5 },
    { registration: 'EF-456-GH', brand: 'Dacia', model: 'Duster', year: 2023, color: 'Gris', dailyRate: 500, fuel: 'DIESEL' as const, transmission: 'MANUAL' as const, seats: 5 },
    { registration: 'IJ-789-KL', brand: 'Mercedes', model: 'Classe C', year: 2025, color: 'Noir', dailyRate: 900, fuel: 'PETROL' as const, transmission: 'AUTOMATIC' as const, seats: 5 },
  ];

  for (const v of vehicles) {
    const existing = await prisma.vehicle.findFirst({
      where: { tenantId: tenant.id, registration: v.registration },
    });
    if (!existing) {
      await prisma.vehicle.create({
        data: {
          tenantId: tenant.id,
          registration: v.registration,
          brand: v.brand,
          model: v.model,
          year: v.year,
          color: v.color,
          dailyRate: v.dailyRate,
          fuel: v.fuel,
          transmission: v.transmission,
          seats: v.seats,
          status: VehicleStatus.AVAILABLE,
          currentKm: 15000 + Math.floor(Math.random() * 50000),
        },
      });
      console.log(`Vehicle: ${v.brand} ${v.model} (${v.registration})`);
    }
  }

  // 4. Create test client
  const client = await prisma.client.upsert({
    where: {
      tenant_idNumber_unique: { tenantId: tenant.id, idNumber: 'CIN-TEST-001' },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      fullName: 'Mohammed Alami',
      type: 'INDIVIDUAL',
      idNumber: 'CIN-TEST-001',
      idType: 'CIN',
      phone: '+212 661 234 567',
      email: 'mohammed.alami@test.com',
      city: 'Casablanca',
      country: 'MA',
      segment: 'REGULAR',
    },
  });
  console.log(`Client: ${client.fullName} (${client.id})`);

  // 5. Create test reservation
  const vehicle1 = await prisma.vehicle.findFirst({
    where: { tenantId: tenant.id, registration: 'AB-123-CD' },
  });
  if (vehicle1) {
    const existingRes = await prisma.reservation.findFirst({
      where: { tenantId: tenant.id, vehicleId: vehicle1.id, clientId: client.id },
    });
    if (!existingRes) {
      const start = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const end = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      const res = await prisma.reservation.create({
        data: {
          tenantId: tenant.id,
          reservationCode: 'RSV-DEMO-0001',
          vehicleId: vehicle1.id,
          clientId: client.id,
          startDate: start,
          endDate: end,
          dailyRate: vehicle1.dailyRate,
          totalAmount: Number(vehicle1.dailyRate) * 3,
          status: 'CONFIRMED',
          source: 'DIRECT',
          pickupLocation: 'Agence Casablanca',
          returnLocation: 'Agence Casablanca',
        },
      });
      console.log(`Reservation: ${res.reservationCode}`);
    }
  }

  console.log('\nSeed completed successfully!');
  console.log('─────────────────────────────────');
  console.log('Login credentials:');
  console.log('  Email:    admin@test.com');
  console.log('  Password: Admin123!');
  console.log('─────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
