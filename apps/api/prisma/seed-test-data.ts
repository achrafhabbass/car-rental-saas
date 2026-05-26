/* eslint-disable no-console */
/**
 * Comprehensive test-data seeder for the `test-agency` tenant.
 *
 * Idempotent: every entity is upserted on its natural unique key so the
 * script can be re-run safely. Existing rows are left intact; only the
 * missing fixtures are inserted.
 *
 * Run: pnpm --filter @autosphere/api exec ts-node prisma/seed-test-data.ts
 */
import {
  ClientSegment,
  ClientType,
  ContractStatus,
  CreditPaymentStatus,
  CreditStatus,
  CreditType,
  DepositMethod,
  DepositStatus,
  FuelLevel,
  InspectionStatus,
  InspectionType,
  InvoiceStatus,
  MaintenanceStatus,
  MaintenanceType,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  ReservationPaymentStatus,
  ReservationSource,
  ReservationStatus,
  UserRole,
  UserStatus,
  VehicleConditionRating,
  VehicleFuel,
  VehicleStatus,
  VehicleTransmission,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const TENANT_SLUG = 'test-agency';

// All dates are computed relative to a fixed reference so re-runs stay
// stable, and tests on overdue/upcoming flows have a predictable window.
const NOW = new Date();
const day = (n: number) => new Date(NOW.getTime() + n * 24 * 60 * 60 * 1000);

async function main() {
  console.log('🌱 Seeding test data into tenant `test-agency`…\n');

  const tenant = await prisma.tenant.findUnique({ where: { slug: TENANT_SLUG } });
  if (!tenant) {
    throw new Error(
      `Tenant ${TENANT_SLUG} not found. Run \`pnpm prisma:seed\` first to bootstrap it.`,
    );
  }
  const tenantId = tenant.id;
  console.log(`✓ Tenant: ${tenant.name} (${tenantId})`);

  const adminUser = await prisma.user.findFirst({
    where: { tenantId, role: 'ADMIN', deletedAt: null },
  });
  if (!adminUser) throw new Error('Admin user missing — run base seed first.');

  await seedTeam(tenantId);
  const vehicles = await seedVehicles(tenantId);
  const clients = await seedClients(tenantId);
  const reservations = await seedReservations(tenantId, vehicles, clients);
  const contracts = await seedContracts(tenantId, adminUser.id, vehicles, clients, reservations);
  await seedInspections(tenantId, contracts);
  await seedDeposits(tenantId, contracts);
  const invoices = await seedInvoices(tenantId, contracts);
  await seedPayments(tenantId, contracts, invoices);
  await seedVehicleCredits(tenantId, vehicles);
  await seedMaintenance(tenantId, vehicles);
  await seedAlerts(tenantId, vehicles);

  console.log('\n🎉 Test data seeding complete.');
  await printSummary(tenantId);
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

const PASSWORD_HASH = bcrypt.hashSync('Password123!', 12);

// ─────────────────────────────────────────────────────────────────────────
// Team / users
// ─────────────────────────────────────────────────────────────────────────

const TEAM = [
  { firstName: 'Yassine', lastName: 'Benali', email: 'manager@test.com', role: UserRole.MANAGER },
  { firstName: 'Salma', lastName: 'El Idrissi', email: 'agent@test.com', role: UserRole.EMPLOYEE },
  { firstName: 'Karim', lastName: 'Bouhmid', email: 'agent2@test.com', role: UserRole.EMPLOYEE },
  { firstName: 'Nadia', lastName: 'Tazi', email: 'compta@test.com', role: UserRole.ACCOUNTANT },
];

async function seedTeam(tenantId: string) {
  console.log('\n👥 Team members…');
  for (const m of TEAM) {
    await prisma.user.upsert({
      where: { tenant_email_unique: { tenantId, email: m.email } },
      update: {},
      create: {
        tenantId,
        email: m.email,
        passwordHash: PASSWORD_HASH,
        firstName: m.firstName,
        lastName: m.lastName,
        role: m.role,
        status: UserStatus.ACTIVE,
      },
    });
    console.log(`  · ${m.firstName} ${m.lastName} (${m.role})`);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Vehicles
// ─────────────────────────────────────────────────────────────────────────

interface VehicleSeed {
  registration: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  category: string;
  transmission: VehicleTransmission;
  fuel: VehicleFuel;
  seats: number;
  currentKm: number;
  dailyRate: number;
  weeklyRate?: number;
  monthlyRate?: number;
  status: VehicleStatus;
  insuranceExpiry: Date;
  technicalVisitExpiry: Date;
  vignetteExpiry?: Date;
  purchasePrice?: number;
}

const VEHICLE_SEEDS: VehicleSeed[] = [
  { registration: '12345-A-1', brand: 'Dacia', model: 'Logan', year: 2023, color: 'Blanc', category: 'Berline économique', transmission: 'MANUAL', fuel: 'DIESEL', seats: 5, currentKm: 24500, dailyRate: 280, weeklyRate: 1700, monthlyRate: 6500, status: 'AVAILABLE', insuranceExpiry: day(120), technicalVisitExpiry: day(80), vignetteExpiry: day(200), purchasePrice: 145000 },
  { registration: '23456-B-3', brand: 'Dacia', model: 'Sandero', year: 2024, color: 'Gris', category: 'Citadine', transmission: 'MANUAL', fuel: 'PETROL', seats: 5, currentKm: 11200, dailyRate: 300, weeklyRate: 1850, monthlyRate: 7000, status: 'RENTED', insuranceExpiry: day(90), technicalVisitExpiry: day(40), purchasePrice: 152000 },
  { registration: '34567-C-2', brand: 'Renault', model: 'Clio', year: 2023, color: 'Bleu', category: 'Citadine', transmission: 'MANUAL', fuel: 'DIESEL', seats: 5, currentKm: 31800, dailyRate: 320, weeklyRate: 1950, monthlyRate: 7500, status: 'AVAILABLE', insuranceExpiry: day(60), technicalVisitExpiry: day(15), purchasePrice: 168000 },
  { registration: '45678-D-4', brand: 'Renault', model: 'Megane', year: 2024, color: 'Noir', category: 'Berline', transmission: 'AUTOMATIC', fuel: 'DIESEL', seats: 5, currentKm: 8700, dailyRate: 450, weeklyRate: 2750, monthlyRate: 10500, status: 'AVAILABLE', insuranceExpiry: day(200), technicalVisitExpiry: day(150), purchasePrice: 245000 },
  { registration: '56789-E-1', brand: 'Hyundai', model: 'i10', year: 2023, color: 'Rouge', category: 'Citadine', transmission: 'MANUAL', fuel: 'PETROL', seats: 4, currentKm: 19400, dailyRate: 250, weeklyRate: 1500, monthlyRate: 5800, status: 'AVAILABLE', insuranceExpiry: day(110), technicalVisitExpiry: day(70), purchasePrice: 128000 },
  { registration: '67890-F-3', brand: 'Hyundai', model: 'Accent', year: 2024, color: 'Argent', category: 'Berline', transmission: 'AUTOMATIC', fuel: 'PETROL', seats: 5, currentKm: 6200, dailyRate: 400, weeklyRate: 2400, monthlyRate: 9200, status: 'RENTED', insuranceExpiry: day(180), technicalVisitExpiry: day(130), purchasePrice: 198000 },
  { registration: '78901-G-2', brand: 'KIA', model: 'Picanto', year: 2023, color: 'Blanc', category: 'Citadine', transmission: 'AUTOMATIC', fuel: 'PETROL', seats: 4, currentKm: 22100, dailyRate: 290, weeklyRate: 1750, monthlyRate: 6800, status: 'AVAILABLE', insuranceExpiry: day(95), technicalVisitExpiry: day(55), purchasePrice: 138000 },
  { registration: '89012-H-4', brand: 'KIA', model: 'Cerato', year: 2024, color: 'Bleu nuit', category: 'Berline', transmission: 'AUTOMATIC', fuel: 'PETROL', seats: 5, currentKm: 9800, dailyRate: 480, weeklyRate: 2900, monthlyRate: 11000, status: 'MAINTENANCE', insuranceExpiry: day(220), technicalVisitExpiry: day(170), purchasePrice: 265000 },
  { registration: '90123-I-1', brand: 'Volkswagen', model: 'Polo', year: 2023, color: 'Gris foncé', category: 'Citadine', transmission: 'MANUAL', fuel: 'PETROL', seats: 5, currentKm: 27300, dailyRate: 380, weeklyRate: 2300, monthlyRate: 8800, status: 'AVAILABLE', insuranceExpiry: day(75), technicalVisitExpiry: day(25), purchasePrice: 185000 },
  { registration: '11234-J-3', brand: 'Volkswagen', model: 'Golf', year: 2024, color: 'Blanc', category: 'Compacte', transmission: 'AUTOMATIC', fuel: 'DIESEL', seats: 5, currentKm: 5400, dailyRate: 550, weeklyRate: 3300, monthlyRate: 12500, status: 'AVAILABLE', insuranceExpiry: day(240), technicalVisitExpiry: day(190), purchasePrice: 295000 },
  { registration: '22345-K-2', brand: 'Mercedes', model: 'Classe A', year: 2024, color: 'Noir', category: 'Premium', transmission: 'AUTOMATIC', fuel: 'DIESEL', seats: 5, currentKm: 4100, dailyRate: 850, weeklyRate: 5100, monthlyRate: 19500, status: 'RENTED', insuranceExpiry: day(260), technicalVisitExpiry: day(210), purchasePrice: 425000 },
  { registration: '33456-L-4', brand: 'Audi', model: 'A3', year: 2024, color: 'Gris métal', category: 'Premium', transmission: 'AUTOMATIC', fuel: 'PETROL', seats: 5, currentKm: 3800, dailyRate: 900, weeklyRate: 5400, monthlyRate: 20500, status: 'AVAILABLE', insuranceExpiry: day(280), technicalVisitExpiry: day(230), purchasePrice: 465000 },
  { registration: '44567-M-1', brand: 'Range Rover', model: 'Evoque', year: 2023, color: 'Noir', category: 'SUV Premium', transmission: 'AUTOMATIC', fuel: 'DIESEL', seats: 5, currentKm: 18900, dailyRate: 1200, weeklyRate: 7200, monthlyRate: 27500, status: 'RENTED', insuranceExpiry: day(140), technicalVisitExpiry: day(100), purchasePrice: 680000 },
  { registration: '55678-N-3', brand: 'Toyota', model: 'Yaris', year: 2023, color: 'Rouge', category: 'Citadine', transmission: 'MANUAL', fuel: 'HYBRID', seats: 5, currentKm: 21500, dailyRate: 340, weeklyRate: 2050, monthlyRate: 7800, status: 'MAINTENANCE', insuranceExpiry: day(85), technicalVisitExpiry: day(45), purchasePrice: 175000 },
  { registration: '66789-O-2', brand: 'Peugeot', model: '301', year: 2022, color: 'Blanc', category: 'Berline', transmission: 'MANUAL', fuel: 'DIESEL', seats: 5, currentKm: 47200, dailyRate: 310, weeklyRate: 1850, monthlyRate: 7100, status: 'INACTIVE', insuranceExpiry: day(-30), technicalVisitExpiry: day(-15), purchasePrice: 145000 },
];

async function seedVehicles(tenantId: string) {
  console.log('\n🚗 Vehicles…');
  const out: { id: string; reg: string; status: VehicleStatus; dailyRate: number }[] = [];
  for (const v of VEHICLE_SEEDS) {
    const existing = await prisma.vehicle.findFirst({
      where: { tenantId, registration: v.registration },
    });
    if (existing) {
      out.push({ id: existing.id, reg: existing.registration, status: existing.status, dailyRate: Number(existing.dailyRate) });
      continue;
    }
    const created = await prisma.vehicle.create({
      data: {
        tenantId,
        registration: v.registration,
        brand: v.brand,
        model: v.model,
        year: v.year,
        color: v.color,
        category: v.category,
        transmission: v.transmission,
        fuel: v.fuel,
        seats: v.seats,
        status: v.status,
        currentKm: v.currentKm,
        dailyRate: v.dailyRate,
        weeklyRate: v.weeklyRate,
        monthlyRate: v.monthlyRate,
        insuranceExpiry: v.insuranceExpiry,
        technicalVisitExpiry: v.technicalVisitExpiry,
        vignetteExpiry: v.vignetteExpiry,
        purchaseDate: day(-365 - Math.floor(Math.random() * 365)),
        purchasePrice: v.purchasePrice,
      },
    });
    out.push({ id: created.id, reg: created.registration, status: created.status, dailyRate: Number(created.dailyRate) });
    console.log(`  · ${v.brand} ${v.model} ${v.registration}`);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────
// Clients
// ─────────────────────────────────────────────────────────────────────────

interface ClientSeed {
  fullName: string;
  type: ClientType;
  idNumber: string;
  idType: string;
  licenseNumber?: string;
  licenseExpiry?: Date;
  phone: string;
  email?: string;
  city: string;
  segment: ClientSegment;
  blacklisted?: boolean;
  blacklistReason?: string;
  companyName?: string;
}

const CLIENT_SEEDS: ClientSeed[] = [
  { fullName: 'Yassine Amrani', type: 'INDIVIDUAL', idNumber: 'BK123456', idType: 'CIN', licenseNumber: 'DL-2018-0001', licenseExpiry: day(800), phone: '+212 661 123 456', email: 'y.amrani@example.com', city: 'Casablanca', segment: 'VIP' },
  { fullName: 'Salma Benkirane', type: 'INDIVIDUAL', idNumber: 'AB234567', idType: 'CIN', licenseNumber: 'DL-2019-0123', licenseExpiry: day(420), phone: '+212 662 234 567', email: 'salma.benk@example.com', city: 'Rabat', segment: 'REGULAR' },
  { fullName: 'Karim Bouhmid', type: 'INDIVIDUAL', idNumber: 'CD345678', idType: 'CIN', licenseNumber: 'DL-2017-0456', licenseExpiry: day(280), phone: '+212 663 345 678', email: 'k.bouhmid@example.com', city: 'Marrakech', segment: 'REGULAR' },
  { fullName: 'Nadia Berrada', type: 'INDIVIDUAL', idNumber: 'EF456789', idType: 'CIN', licenseNumber: 'DL-2020-0789', licenseExpiry: day(950), phone: '+212 664 456 789', email: 'nadia.berrada@example.com', city: 'Casablanca', segment: 'VIP' },
  { fullName: 'Omar Tazi', type: 'INDIVIDUAL', idNumber: 'GH567890', idType: 'CIN', licenseNumber: 'DL-2016-0234', licenseExpiry: day(40), phone: '+212 665 567 890', email: 'o.tazi@example.com', city: 'Fès', segment: 'REGULAR' },
  { fullName: 'Imane El Fassi', type: 'INDIVIDUAL', idNumber: 'IJ678901', idType: 'CIN', licenseNumber: 'DL-2021-0567', licenseExpiry: day(1100), phone: '+212 666 678 901', email: 'i.elfassi@example.com', city: 'Tanger', segment: 'OCCASIONAL' },
  { fullName: 'Hicham Sebti', type: 'INDIVIDUAL', idNumber: 'KL789012', idType: 'CIN', licenseNumber: 'DL-2015-0890', licenseExpiry: day(-30), phone: '+212 667 789 012', email: 'h.sebti@example.com', city: 'Agadir', segment: 'AT_RISK', blacklisted: true, blacklistReason: 'Retour véhicule très endommagé · non-paiement de la franchise' },
  { fullName: 'Leila Mansouri', type: 'INDIVIDUAL', idNumber: 'MN890123', idType: 'CIN', licenseNumber: 'DL-2019-0345', licenseExpiry: day(600), phone: '+212 668 890 123', email: 'l.mansouri@example.com', city: 'Casablanca', segment: 'REGULAR' },
  { fullName: 'Mehdi Chraibi', type: 'INDIVIDUAL', idNumber: 'OP901234', idType: 'CIN', licenseNumber: 'DL-2018-0901', licenseExpiry: day(380), phone: '+212 669 901 234', email: 'm.chraibi@example.com', city: 'Rabat', segment: 'REGULAR' },
  { fullName: 'Asma Bouazza', type: 'INDIVIDUAL', idNumber: 'QR012345', idType: 'CIN', licenseNumber: 'DL-2022-0012', licenseExpiry: day(1300), phone: '+212 670 012 345', email: 'a.bouazza@example.com', city: 'Marrakech', segment: 'OCCASIONAL' },
  { fullName: 'Adam Lahlou', type: 'INDIVIDUAL', idNumber: 'ST123456', idType: 'CIN', licenseNumber: 'DL-2017-0123', licenseExpiry: day(220), phone: '+212 671 123 456', email: 'a.lahlou@example.com', city: 'Meknès', segment: 'REGULAR' },
  { fullName: 'Sofia Naciri', type: 'INDIVIDUAL', idNumber: 'UV234567', idType: 'CIN', licenseNumber: 'DL-2020-0234', licenseExpiry: day(850), phone: '+212 672 234 567', email: 's.naciri@example.com', city: 'Casablanca', segment: 'VIP' },
  { fullName: 'Reda El Houari', type: 'INDIVIDUAL', idNumber: 'WX345678', idType: 'PASSPORT', licenseNumber: 'DL-2019-0345', licenseExpiry: day(490), phone: '+212 673 345 678', email: 'r.elhouari@example.com', city: 'Tanger', segment: 'AT_RISK' },
  { fullName: 'Hamza Idrissi', type: 'INDIVIDUAL', idNumber: 'YZ456789', idType: 'CIN', licenseNumber: 'DL-2021-0789', licenseExpiry: day(1050), phone: '+212 674 456 789', email: 'h.idrissi@example.com', city: 'Oujda', segment: 'OCCASIONAL' },
  { fullName: 'Atlas Tourisme SARL', type: 'COMPANY', companyName: 'Atlas Tourisme SARL', idNumber: 'RC-CAS-78901', idType: 'RC', phone: '+212 522 567 890', email: 'contact@atlas-tourisme.ma', city: 'Casablanca', segment: 'VIP' },
  { fullName: 'Sahara Excursions', type: 'COMPANY', companyName: 'Sahara Excursions SARL', idNumber: 'RC-MAR-12345', idType: 'RC', phone: '+212 524 678 901', email: 'reservations@sahara-exc.ma', city: 'Marrakech', segment: 'REGULAR' },
  { fullName: 'Voyages Tanger Med', type: 'COMPANY', companyName: 'Voyages Tanger Med SA', idNumber: 'RC-TGR-23456', idType: 'RC', phone: '+212 539 789 012', email: 'admin@tangermed-voyages.ma', city: 'Tanger', segment: 'REGULAR' },
  { fullName: 'OCP Mobility', type: 'COMPANY', companyName: 'OCP Mobility (filiale)', idNumber: 'RC-CAS-99999', idType: 'RC', phone: '+212 522 999 000', email: 'fleet@ocpmobility.ma', city: 'Casablanca', segment: 'VIP' },
];

async function seedClients(tenantId: string) {
  console.log('\n👤 Clients…');
  const out: { id: string; fullName: string; type: ClientType }[] = [];
  for (const c of CLIENT_SEEDS) {
    const existing = await prisma.client.findFirst({
      where: { tenantId, idNumber: c.idNumber },
    });
    if (existing) {
      out.push({ id: existing.id, fullName: existing.fullName, type: existing.type });
      continue;
    }
    const created = await prisma.client.create({
      data: {
        tenantId,
        fullName: c.fullName,
        type: c.type,
        companyName: c.companyName,
        idNumber: c.idNumber,
        idType: c.idType,
        licenseNumber: c.licenseNumber,
        licenseExpiry: c.licenseExpiry,
        phone: c.phone,
        email: c.email,
        city: c.city,
        country: 'MA',
        segment: c.segment,
        blacklisted: c.blacklisted ?? false,
        blacklistReason: c.blacklistReason,
        rating: c.segment === 'VIP' ? 4.8 : c.segment === 'AT_RISK' ? 2.1 : 4.0,
      },
    });
    out.push({ id: created.id, fullName: created.fullName, type: created.type });
    console.log(`  · ${c.fullName}`);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────
// Reservations
// ─────────────────────────────────────────────────────────────────────────

interface ReservationSpec {
  code: string;
  vehicleIdx: number; // index into vehicles[]
  clientIdx: number; // index into clients[]
  startOffsetDays: number;
  durationDays: number;
  status: ReservationStatus;
  paymentStatus: ReservationPaymentStatus;
  source: ReservationSource;
}

const RES_SPECS: ReservationSpec[] = [
  { code: 'RSV-2025-0010', vehicleIdx: 1, clientIdx: 1, startOffsetDays: -2, durationDays: 5, status: 'CONFIRMED', paymentStatus: 'PARTIAL', source: 'DIRECT' },
  { code: 'RSV-2025-0011', vehicleIdx: 5, clientIdx: 3, startOffsetDays: -7, durationDays: 4, status: 'CONFIRMED', paymentStatus: 'PAID', source: 'WEBSITE' },
  { code: 'RSV-2025-0012', vehicleIdx: 10, clientIdx: 11, startOffsetDays: -3, durationDays: 7, status: 'CONFIRMED', paymentStatus: 'PAID', source: 'PARTNER' },
  { code: 'RSV-2025-0013', vehicleIdx: 12, clientIdx: 14, startOffsetDays: -1, durationDays: 14, status: 'CONFIRMED', paymentStatus: 'PARTIAL', source: 'PHONE' },
  { code: 'RSV-2025-0014', vehicleIdx: 2, clientIdx: 2, startOffsetDays: 3, durationDays: 4, status: 'PENDING', paymentStatus: 'PENDING', source: 'WEBSITE' },
  { code: 'RSV-2025-0015', vehicleIdx: 9, clientIdx: 8, startOffsetDays: 7, durationDays: 10, status: 'PENDING', paymentStatus: 'PENDING', source: 'DIRECT' },
  { code: 'RSV-2025-0016', vehicleIdx: 4, clientIdx: 5, startOffsetDays: 14, durationDays: 3, status: 'CONFIRMED', paymentStatus: 'PARTIAL', source: 'WEBSITE' },
  { code: 'RSV-2025-0017', vehicleIdx: 6, clientIdx: 9, startOffsetDays: -15, durationDays: 3, status: 'COMPLETED', paymentStatus: 'PAID', source: 'WALK_IN' },
  { code: 'RSV-2025-0018', vehicleIdx: 0, clientIdx: 6, startOffsetDays: -25, durationDays: 5, status: 'CANCELLED', paymentStatus: 'REFUNDED', source: 'DIRECT' },
  { code: 'RSV-2025-0019', vehicleIdx: 3, clientIdx: 10, startOffsetDays: -10, durationDays: 4, status: 'NO_SHOW', paymentStatus: 'PENDING', source: 'WEBSITE' },
];

async function seedReservations(
  tenantId: string,
  vehicles: { id: string; dailyRate: number }[],
  clients: { id: string }[],
) {
  console.log('\n📅 Reservations…');
  const out: { id: string; code: string; vehicleId: string; clientId: string; status: ReservationStatus }[] = [];
  for (const r of RES_SPECS) {
    const existing = await prisma.reservation.findFirst({
      where: { tenantId, reservationCode: r.code },
    });
    if (existing) {
      out.push({ id: existing.id, code: existing.reservationCode, vehicleId: existing.vehicleId, clientId: existing.clientId, status: existing.status });
      continue;
    }
    const v = pick(vehicles, r.vehicleIdx);
    const c = pick(clients, r.clientIdx);
    const start = day(r.startOffsetDays);
    const end = day(r.startOffsetDays + r.durationDays);
    const total = v.dailyRate * r.durationDays;
    const created = await prisma.reservation.create({
      data: {
        tenantId,
        reservationCode: r.code,
        vehicleId: v.id,
        clientId: c.id,
        startDate: start,
        endDate: end,
        dailyRate: v.dailyRate,
        totalAmount: total,
        status: r.status,
        paymentStatus: r.paymentStatus,
        source: r.source,
        pickupLocation: 'Aéroport Casablanca · Terminal 1',
        returnLocation: 'Agence centrale · Casablanca',
      },
    });
    out.push({ id: created.id, code: created.reservationCode, vehicleId: created.vehicleId, clientId: created.clientId, status: created.status });
    console.log(`  · ${r.code} (${r.status})`);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────
// Contracts
// ─────────────────────────────────────────────────────────────────────────

interface ContractSpec {
  number: string;
  /** Index into reservations[] to derive vehicle/client/dates from. */
  reservationIdx: number;
  startOffsetDays: number;
  durationDays: number;
  status: ContractStatus;
  deposit: number;
  signed: boolean;
  extraCharges?: number;
}

const CONTRACT_SPECS: ContractSpec[] = [
  { number: 'CTR-2025-0042', reservationIdx: 0, startOffsetDays: -2, durationDays: 5, status: 'ACTIVE', deposit: 2000, signed: true },
  { number: 'CTR-2025-0043', reservationIdx: 1, startOffsetDays: -7, durationDays: 4, status: 'ACTIVE', deposit: 1500, signed: true },
  { number: 'CTR-2025-0044', reservationIdx: 2, startOffsetDays: -3, durationDays: 7, status: 'ACTIVE', deposit: 3000, signed: true },
  { number: 'CTR-2025-0045', reservationIdx: 3, startOffsetDays: -1, durationDays: 14, status: 'ACTIVE', deposit: 5000, signed: true },
  { number: 'CTR-2025-0046', reservationIdx: 7, startOffsetDays: -15, durationDays: 3, status: 'COMPLETED', deposit: 2000, signed: true, extraCharges: 200 },
  { number: 'CTR-2025-0047', reservationIdx: -1, startOffsetDays: -8, durationDays: 2, status: 'COMPLETED', deposit: 1000, signed: true },
  { number: 'CTR-2025-0048', reservationIdx: -1, startOffsetDays: -45, durationDays: 30, status: 'COMPLETED', deposit: 5000, signed: true, extraCharges: 800 },
  { number: 'CTR-2025-0049', reservationIdx: -1, startOffsetDays: -20, durationDays: 5, status: 'OVERDUE', deposit: 2000, signed: true, extraCharges: 450 },
];

// Walk-in contracts (reservationIdx=-1) need their own vehicle+client pick.
const WALK_IN_LINKS: Array<{ vehicleIdx: number; clientIdx: number }> = [
  { vehicleIdx: 7, clientIdx: 4 },
  { vehicleIdx: 11, clientIdx: 17 },
  { vehicleIdx: 8, clientIdx: 12 },
];

async function seedContracts(
  tenantId: string,
  adminId: string,
  vehicles: { id: string; dailyRate: number }[],
  clients: { id: string }[],
  reservations: { id: string; vehicleId: string; clientId: string }[],
) {
  console.log('\n📄 Contracts…');
  const out: {
    id: string;
    number: string;
    vehicleId: string;
    clientId: string;
    status: ContractStatus;
    totalAmount: number;
    startDate: Date;
    endDate: Date;
  }[] = [];

  let walkInCursor = 0;
  for (const c of CONTRACT_SPECS) {
    const existing = await prisma.rentalContract.findFirst({
      where: { tenantId, contractNumber: c.number },
    });
    if (existing) {
      out.push({
        id: existing.id,
        number: existing.contractNumber,
        vehicleId: existing.vehicleId,
        clientId: existing.clientId,
        status: existing.status,
        totalAmount: Number(existing.totalAmount),
        startDate: existing.startDate,
        endDate: existing.endDate,
      });
      continue;
    }

    let vehicleId: string;
    let clientId: string;
    let reservationId: string | undefined;
    if (c.reservationIdx >= 0 && c.reservationIdx < reservations.length) {
      const r = reservations[c.reservationIdx];
      vehicleId = r.vehicleId;
      clientId = r.clientId;
      reservationId = r.id;
    } else {
      const link = WALK_IN_LINKS[walkInCursor % WALK_IN_LINKS.length];
      walkInCursor += 1;
      vehicleId = pick(vehicles, link.vehicleIdx).id;
      clientId = pick(clients, link.clientIdx).id;
    }

    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) throw new Error('Vehicle lookup failed for contract');

    const start = day(c.startOffsetDays);
    const end = day(c.startOffsetDays + c.durationDays);
    const total = vehicle.dailyRate * c.durationDays + (c.extraCharges ?? 0);

    const created = await prisma.rentalContract.create({
      data: {
        tenantId,
        contractNumber: c.number,
        vehicleId,
        clientId,
        reservationId,
        createdByUserId: adminId,
        startDate: start,
        endDate: end,
        actualReturnDate: c.status === 'COMPLETED' ? end : null,
        kmStart: 10000 + Math.floor(Math.random() * 30000),
        kmEnd: c.status === 'COMPLETED' ? 10500 + Math.floor(Math.random() * 30500) : null,
        kmAllowance: 250, // daily
        dailyRate: vehicle.dailyRate,
        totalAmount: total,
        depositAmount: c.deposit,
        depositMethod: 'CARD_IMPRINT',
        extraCharges: c.extraCharges ?? 0,
        pickupLocation: 'Aéroport Casablanca',
        returnLocation: 'Agence centrale',
        status: c.status,
        signedAt: c.signed ? day(c.startOffsetDays) : null,
        signatureUrl: c.signed
          ? 'https://placehold.co/400x120/png?text=Signature+client'
          : null,
      },
    });
    out.push({
      id: created.id,
      number: created.contractNumber,
      vehicleId: created.vehicleId,
      clientId: created.clientId,
      status: created.status,
      totalAmount: Number(created.totalAmount),
      startDate: created.startDate,
      endDate: created.endDate,
    });
    console.log(`  · ${c.number} (${c.status})`);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────
// Inspections — DEPARTURE + RETURN pairs for completed contracts
// ─────────────────────────────────────────────────────────────────────────

async function seedInspections(
  tenantId: string,
  contracts: { id: string; vehicleId: string; status: ContractStatus; startDate: Date; endDate: Date }[],
) {
  console.log('\n🔍 Inspections…');
  const eligible = contracts.filter((c) => c.status === 'COMPLETED' || c.status === 'ACTIVE');
  for (const c of eligible) {
    const depExisting = await prisma.vehicleInspection.findUnique({
      where: { contractId_type: { contractId: c.id, type: 'DEPARTURE' } },
    });
    if (!depExisting) {
      await prisma.vehicleInspection.create({
        data: {
          tenantId,
          vehicleId: c.vehicleId,
          contractId: c.id,
          type: InspectionType.DEPARTURE,
          status: InspectionStatus.COMPLETED,
          performedAt: c.startDate,
          km: 20000 + Math.floor(Math.random() * 20000),
          fuelLevel: FuelLevel.FULL,
          condition: VehicleConditionRating.GOOD,
          damages: 'RAS · état général conforme',
          agentName: 'Salma El Idrissi',
        },
      });
    }
    if (c.status === 'COMPLETED') {
      const retExisting = await prisma.vehicleInspection.findUnique({
        where: { contractId_type: { contractId: c.id, type: 'RETURN' } },
      });
      if (!retExisting) {
        const hasDamage = Math.random() < 0.3;
        await prisma.vehicleInspection.create({
          data: {
            tenantId,
            vehicleId: c.vehicleId,
            contractId: c.id,
            type: InspectionType.RETURN,
            status: InspectionStatus.COMPLETED,
            performedAt: c.endDate,
            km: 20500 + Math.floor(Math.random() * 21000),
            fuelLevel: hasDamage ? FuelLevel.THREE_QUARTERS : FuelLevel.FULL,
            condition: hasDamage ? VehicleConditionRating.FAIR : VehicleConditionRating.GOOD,
            damages: hasDamage
              ? 'Rayure pare-chocs arrière côté droit · 15 cm. Niveau de carburant inférieur de 1/4.'
              : 'RAS · véhicule rendu conforme au départ.',
            agentName: 'Karim Bouhmid',
          },
        });
      }
    }
    console.log(`  · ${c.id.slice(0, 8)} (${c.status})`);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Deposits — one per active contract
// ─────────────────────────────────────────────────────────────────────────

async function seedDeposits(
  tenantId: string,
  contracts: { id: string; clientId: string; status: ContractStatus }[],
) {
  console.log('\n💰 Deposits…');
  let counter = 1;
  for (const c of contracts) {
    const existing = await prisma.deposit.findUnique({ where: { contractId: c.id } });
    if (existing) continue;
    const amount = 2000 + counter * 250;
    const status: DepositStatus =
      c.status === 'COMPLETED'
        ? counter % 4 === 0
          ? 'CONSUMED'
          : counter % 3 === 0
            ? 'PARTIAL_REFUND'
            : 'REFUNDED'
        : 'HELD';
    await prisma.deposit.create({
      data: {
        tenantId,
        depositNumber: `DEP-2025-${String(100 + counter).padStart(4, '0')}`,
        contractId: c.id,
        clientId: c.clientId,
        amount,
        method: DepositMethod.CARD_IMPRINT,
        status,
        refundedAmount: status === 'REFUNDED' ? amount : status === 'PARTIAL_REFUND' ? amount * 0.7 : 0,
        consumedAmount: status === 'CONSUMED' ? amount : status === 'PARTIAL_REFUND' ? amount * 0.3 : 0,
        settledAt: status === 'HELD' ? null : new Date(),
      },
    });
    counter += 1;
  }
  console.log(`  · ${counter - 1} deposits seeded`);
}

// ─────────────────────────────────────────────────────────────────────────
// Invoices
// ─────────────────────────────────────────────────────────────────────────

async function seedInvoices(
  tenantId: string,
  contracts: { id: string; clientId: string; totalAmount: number; status: ContractStatus }[],
) {
  console.log('\n🧾 Invoices…');
  const out: { id: string; number: string; clientId: string; total: number; balance: number }[] = [];
  let counter = 1;
  for (const c of contracts) {
    const number = `INV-2025-${String(200 + counter).padStart(4, '0')}`;
    const existing = await prisma.invoice.findFirst({
      where: { tenantId, invoiceNumber: number },
    });
    if (existing) {
      out.push({ id: existing.id, number: existing.invoiceNumber, clientId: existing.clientId, total: Number(existing.total), balance: Number(existing.balance) });
      counter += 1;
      continue;
    }
    const subtotal = c.totalAmount / 1.2; // strip TVA
    const taxAmount = c.totalAmount - subtotal;
    const isPaid = c.status === 'COMPLETED';
    const isPartial = c.status === 'ACTIVE' && counter % 2 === 0;
    const amountPaid = isPaid ? c.totalAmount : isPartial ? c.totalAmount * 0.5 : 0;
    const balance = c.totalAmount - amountPaid;
    const status: InvoiceStatus = isPaid
      ? 'PAID'
      : isPartial
        ? 'PARTIAL'
        : c.status === 'OVERDUE'
          ? 'OVERDUE'
          : 'ISSUED';
    const created = await prisma.invoice.create({
      data: {
        tenantId,
        invoiceNumber: number,
        contractId: c.id,
        clientId: c.clientId,
        issueDate: new Date(),
        dueDate: day(15),
        subtotal: Math.round(subtotal * 100) / 100,
        taxRate: 20,
        taxAmount: Math.round(taxAmount * 100) / 100,
        total: c.totalAmount,
        amountPaid,
        balance,
        status,
        paidAt: isPaid ? new Date() : null,
        lineItems: [
          {
            description: 'Location véhicule',
            quantity: 1,
            unitPrice: subtotal,
            total: subtotal,
          },
        ],
      },
    });
    out.push({ id: created.id, number: created.invoiceNumber, clientId: created.clientId, total: Number(created.total), balance: Number(created.balance) });
    console.log(`  · ${number} (${status})`);
    counter += 1;
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────
// Payments
// ─────────────────────────────────────────────────────────────────────────

async function seedPayments(
  tenantId: string,
  contracts: { id: string; clientId: string; status: ContractStatus; totalAmount: number }[],
  invoices: { id: string; clientId: string; total: number; balance: number }[],
) {
  console.log('\n💳 Payments…');
  let counter = 1;
  for (const inv of invoices) {
    if (inv.balance >= inv.total) continue; // unpaid invoices → no payment row
    const number = `PAY-2025-${String(300 + counter).padStart(4, '0')}`;
    const existing = await prisma.payment.findFirst({
      where: { tenantId, paymentCode: number },
    });
    if (existing) {
      counter += 1;
      continue;
    }
    const amount = inv.total - inv.balance;
    const method: PaymentMethod = counter % 3 === 0 ? 'CARD' : counter % 2 === 0 ? 'BANK_TRANSFER' : 'CASH';
    await prisma.payment.create({
      data: {
        tenantId,
        paymentCode: number,
        invoiceId: inv.id,
        clientId: inv.clientId,
        amount,
        method,
        status: PaymentStatus.CONFIRMED,
        paidAt: new Date(),
        reference: method === 'BANK_TRANSFER' ? `REF-${counter}-2025` : undefined,
      },
    });
    counter += 1;
  }
  // Also a couple of direct contract payments (deposits, partials before invoicing)
  for (const c of contracts.slice(0, 3)) {
    const number = `PAY-2025-${String(400 + counter).padStart(4, '0')}`;
    const existing = await prisma.payment.findFirst({
      where: { tenantId, paymentCode: number },
    });
    if (existing) continue;
    await prisma.payment.create({
      data: {
        tenantId,
        paymentCode: number,
        contractId: c.id,
        clientId: c.clientId,
        amount: 500 + counter * 50,
        method: PaymentMethod.CASH,
        status: PaymentStatus.CONFIRMED,
        notes: 'Acompte versé à la signature',
      },
    });
    counter += 1;
  }
  console.log(`  · ${counter - 1} payments seeded`);
}

// ─────────────────────────────────────────────────────────────────────────
// Vehicle credits + amortization
// ─────────────────────────────────────────────────────────────────────────

interface CreditSpec {
  vehicleIdx: number;
  bankName: string;
  principal: number;
  downPayment: number;
  interestRate: number; // annual, percent
  termMonths: number;
  startOffsetDays: number;
}

const CREDIT_SPECS: CreditSpec[] = [
  { vehicleIdx: 10, bankName: 'Attijariwafa Bank', principal: 425000, downPayment: 85000, interestRate: 5.5, termMonths: 60, startOffsetDays: -540 },
  { vehicleIdx: 11, bankName: 'Banque Populaire', principal: 465000, downPayment: 100000, interestRate: 4.9, termMonths: 60, startOffsetDays: -360 },
  { vehicleIdx: 12, bankName: 'CIH Bank', principal: 680000, downPayment: 150000, interestRate: 6.2, termMonths: 48, startOffsetDays: -720 },
];

function buildAmortization(principal: number, annualRate: number, months: number, startDate: Date) {
  const r = annualRate / 100 / 12;
  const payment = (principal * r) / (1 - (1 + r) ** -months);
  let remaining = principal;
  const out: Array<{ month: number; date: Date; payment: number; principal: number; interest: number }> = [];
  for (let i = 1; i <= months; i++) {
    const interest = remaining * r;
    const principalPart = payment - interest;
    remaining = Math.max(0, remaining - principalPart);
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + i);
    out.push({ month: i, date: d, payment, principal: principalPart, interest });
  }
  return { monthlyPayment: payment, schedule: out };
}

async function seedVehicleCredits(tenantId: string, vehicles: { id: string }[]) {
  console.log('\n🏦 Vehicle credits…');
  for (const spec of CREDIT_SPECS) {
    const v = pick(vehicles, spec.vehicleIdx);
    const existing = await prisma.vehicleCredit.findFirst({
      where: { tenantId, vehicleId: v.id, bankName: spec.bankName },
    });
    if (existing) {
      console.log(`  · ${spec.bankName} on vehicle ${spec.vehicleIdx} (already seeded)`);
      continue;
    }
    const financed = spec.principal - spec.downPayment;
    const start = day(spec.startOffsetDays);
    const { monthlyPayment, schedule } = buildAmortization(
      financed,
      spec.interestRate,
      spec.termMonths,
      start,
    );
    const credit = await prisma.vehicleCredit.create({
      data: {
        tenantId,
        vehicleId: v.id,
        bankName: spec.bankName,
        creditType: CreditType.BANK_CREDIT,
        principal: spec.principal,
        downPayment: spec.downPayment,
        interestRate: spec.interestRate,
        termMonths: spec.termMonths,
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        startDate: start,
        endDate: schedule[schedule.length - 1].date,
        remainingBalance: financed,
        status: CreditStatus.ACTIVE,
      },
    });

    let totalPaid = 0;
    let remaining = financed;
    for (const row of schedule) {
      const isPaid = row.date < NOW;
      const isLate = !isPaid && row.date < day(15);
      const status: CreditPaymentStatus = isPaid ? 'PAID' : isLate ? 'LATE' : 'SCHEDULED';
      if (isPaid) {
        totalPaid += row.payment;
        remaining -= row.principal;
      }
      await prisma.vehicleCreditPayment.create({
        data: {
          tenantId,
          creditId: credit.id,
          installmentNumber: row.month,
          scheduledDate: row.date,
          scheduledAmount: Math.round(row.payment * 100) / 100,
          principalPortion: Math.round(row.principal * 100) / 100,
          interestPortion: Math.round(row.interest * 100) / 100,
          status,
          paidAt: isPaid ? row.date : null,
          paidAmount: isPaid ? Math.round(row.payment * 100) / 100 : null,
        },
      });
    }
    await prisma.vehicleCredit.update({
      where: { id: credit.id },
      data: {
        totalPaid: Math.round(totalPaid * 100) / 100,
        remainingBalance: Math.max(0, Math.round(remaining * 100) / 100),
      },
    });
    console.log(`  · ${spec.bankName} · ${spec.termMonths}m · ${schedule.length} installments`);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Maintenance (records + schedules)
// ─────────────────────────────────────────────────────────────────────────

async function seedMaintenance(tenantId: string, vehicles: { id: string }[]) {
  console.log('\n🔧 Maintenance…');
  const recordTypes: Array<{ type: MaintenanceType; title: string; cost: number; daysAgo: number }> = [
    { type: 'OIL_CHANGE', title: 'Vidange + filtre à huile', cost: 650, daysAgo: 60 },
    { type: 'TIRE_CHANGE', title: 'Remplacement 4 pneus', cost: 2800, daysAgo: 120 },
    { type: 'BRAKES', title: 'Plaquettes avant', cost: 850, daysAgo: 45 },
    { type: 'REVISION', title: 'Révision constructeur 20 000 km', cost: 1850, daysAgo: 30 },
    { type: 'INSPECTION', title: 'Visite technique', cost: 350, daysAgo: 80 },
    { type: 'BATTERY', title: 'Batterie 12V Bosch', cost: 1200, daysAgo: 200 },
  ];
  for (let i = 0; i < recordTypes.length; i++) {
    const v = pick(vehicles, i);
    const r = recordTypes[i];
    const ref = `MAINT-${r.type}-${i + 1}`;
    const existing = await prisma.maintenanceRecord.findFirst({
      where: { tenantId, vehicleId: v.id, reference: ref },
    });
    if (existing) continue;
    await prisma.maintenanceRecord.create({
      data: {
        tenantId,
        vehicleId: v.id,
        type: r.type,
        status: MaintenanceStatus.COMPLETED,
        title: r.title,
        description: 'Effectué chez le garage partenaire Auto Service Casa.',
        performedAt: day(-r.daysAgo),
        cost: r.cost,
        garage: 'Auto Service Casa · Sidi Maârouf',
        reference: ref,
      },
    });
  }

  const scheduleSpecs: Array<{ vIdx: number; type: MaintenanceType; title: string; dueDaysAhead: number; isCritical: boolean }> = [
    { vIdx: 0, type: 'OIL_CHANGE', title: 'Vidange à venir (30 000 km)', dueDaysAhead: 12, isCritical: false },
    { vIdx: 4, type: 'REVISION', title: 'Révision 40 000 km', dueDaysAhead: 25, isCritical: false },
    { vIdx: 2, type: 'BRAKES', title: 'Contrôle freins arrière', dueDaysAhead: -5, isCritical: true },
    { vIdx: 7, type: 'INSPECTION', title: 'Visite technique annuelle', dueDaysAhead: 4, isCritical: true },
    { vIdx: 13, type: 'OIL_CHANGE', title: 'Vidange (hybride)', dueDaysAhead: 45, isCritical: false },
  ];
  for (let i = 0; i < scheduleSpecs.length; i++) {
    const s = scheduleSpecs[i];
    const v = pick(vehicles, s.vIdx);
    const title = `${s.title} · ${i + 1}`;
    const existing = await prisma.maintenanceSchedule.findFirst({
      where: { tenantId, vehicleId: v.id, title },
    });
    if (existing) continue;
    await prisma.maintenanceSchedule.create({
      data: {
        tenantId,
        vehicleId: v.id,
        type: s.type,
        status: MaintenanceStatus.SCHEDULED,
        title,
        description: s.isCritical
          ? 'Intervention prioritaire — sécurité.'
          : 'Entretien planifié selon le carnet constructeur.',
        dueDate: day(s.dueDaysAhead),
        isCritical: s.isCritical,
      },
    });
  }
  console.log(`  · ${recordTypes.length} records + ${scheduleSpecs.length} scheduled`);
}

// ─────────────────────────────────────────────────────────────────────────
// Alerts — a few examples
// ─────────────────────────────────────────────────────────────────────────

async function seedAlerts(tenantId: string, vehicles: { id: string; reg: string }[]) {
  console.log('\n🚨 Alerts…');
  const alerts = [
    { type: 'INSURANCE_EXPIRY' as const, severity: 'CRITICAL' as const, title: 'Assurance expire bientôt', message: `Renouveler l'assurance du véhicule ${vehicles[2].reg} (15 jours).`, vehicleIdx: 2, dueAt: day(15) },
    { type: 'TECHNICAL_VISIT_EXPIRY' as const, severity: 'WARNING' as const, title: 'Visite technique due', message: `Programmer la visite technique pour ${vehicles[14].reg}.`, vehicleIdx: 14, dueAt: day(-15) },
    { type: 'MAINTENANCE_DUE' as const, severity: 'WARNING' as const, title: 'Maintenance planifiée', message: 'Vidange à effectuer cette semaine.', vehicleIdx: 0, dueAt: day(5) },
    { type: 'MAINTENANCE_OVERDUE' as const, severity: 'CRITICAL' as const, title: 'Maintenance en retard', message: 'Contrôle freins en retard de 5 jours.', vehicleIdx: 2, dueAt: day(-5) },
    { type: 'INVOICE_OVERDUE' as const, severity: 'WARNING' as const, title: 'Facture en retard', message: 'Une facture cliente dépasse l\'échéance.', vehicleIdx: 0, dueAt: day(-3) },
  ];
  for (const a of alerts) {
    const v = vehicles[a.vehicleIdx];
    const existing = await prisma.alert.findFirst({
      where: { tenantId, type: a.type, vehicleId: v.id, status: 'OPEN' },
    });
    if (existing) continue;
    await prisma.alert.create({
      data: {
        tenantId,
        type: a.type,
        severity: a.severity,
        status: 'OPEN',
        title: a.title,
        message: a.message,
        vehicleId: v.id,
        dueAt: a.dueAt,
      },
    });
  }
  console.log(`  · ${alerts.length} alerts seeded`);
}

// ─────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────

async function printSummary(tenantId: string) {
  const [
    users, vehicles, clients, reservations, contracts,
    invoices, payments, deposits, inspections,
    credits, creditPayments, maintRecords, maintSchedules, alerts,
  ] = await Promise.all([
    prisma.user.count({ where: { tenantId, deletedAt: null } }),
    prisma.vehicle.count({ where: { tenantId, deletedAt: null } }),
    prisma.client.count({ where: { tenantId, deletedAt: null } }),
    prisma.reservation.count({ where: { tenantId } }),
    prisma.rentalContract.count({ where: { tenantId, deletedAt: null } }),
    prisma.invoice.count({ where: { tenantId, deletedAt: null } }),
    prisma.payment.count({ where: { tenantId } }),
    prisma.deposit.count({ where: { tenantId } }),
    prisma.vehicleInspection.count({ where: { tenantId } }),
    prisma.vehicleCredit.count({ where: { tenantId } }),
    prisma.vehicleCreditPayment.count({ where: { tenantId } }),
    prisma.maintenanceRecord.count({ where: { tenantId } }),
    prisma.maintenanceSchedule.count({ where: { tenantId } }),
    prisma.alert.count({ where: { tenantId } }),
  ]);
  console.log('\n📊 Summary for tenant test-agency:');
  console.log(`   Users:              ${users}`);
  console.log(`   Vehicles:           ${vehicles}`);
  console.log(`   Clients:            ${clients}`);
  console.log(`   Reservations:       ${reservations}`);
  console.log(`   Contracts:          ${contracts}`);
  console.log(`   Invoices:           ${invoices}`);
  console.log(`   Payments:           ${payments}`);
  console.log(`   Deposits:           ${deposits}`);
  console.log(`   Inspections:        ${inspections}`);
  console.log(`   Vehicle credits:    ${credits}`);
  console.log(`   Credit payments:    ${creditPayments}`);
  console.log(`   Maint. records:     ${maintRecords}`);
  console.log(`   Maint. schedules:   ${maintSchedules}`);
  console.log(`   Alerts:             ${alerts}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
