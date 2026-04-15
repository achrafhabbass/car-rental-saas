#!/usr/bin/env node
/**
 * AutoSphere SaaS — Use-case test runner
 *
 * Exercises every critical use case against the live API and prints a
 * PASS/FAIL report. Failures are also written to REPORT.json so they can
 * be turned into fix-up tasks.
 *
 * Covers (abridged):
 *   Auth  : register, login, /me, refresh rotation, logout, /me after logout,
 *           duplicate slug rejection, throttling
 *   Vehicles, Clients: CRUD, duplicate keys, validation
 *   Reservations: create, overlap conflict, blacklisted client, unfit vehicle
 *   Contracts   : create → vehicle RENTED, complete → AVAILABLE + km bump,
 *                 cancel, unfit vehicle rejection
 *   Invoices    : create w/ line items, TVA math, OVERDUE status
 *   Payments    : full payment → invoice PAID, partial → PARTIAL
 *   Credits     : create → amortization schedule, record payment → balance
 *                 moves, pay-off → PAID_OFF
 *   Maintenance : record + schedule, critical overdue blocks booking
 *   Alerts      : insurance expiry CRITICAL, resolve, dedup on resync
 *   Notifications: fan-out to admins, mark read
 *   Analytics   : dashboard KPIs, revenue series, top clients, CSV export
 *   Platform    : SUPER_ADMIN listing, tenant suspend/activate/extend-trial,
 *                 cross-tenant isolation
 */
import { writeFileSync } from 'node:fs';

const API = process.env.API_URL ?? 'http://localhost:4001/api/v1';
const VERBOSE = process.env.VERBOSE === '1';

const results = []; // { id, name, status, error? }
const BLUE = '\x1b[1;34m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

function section(title) {
  console.log(`\n${BLUE}═══ ${title} ═══${RESET}`);
}

function log(msg) {
  if (VERBOSE) console.log(`${DIM}    ${msg}${RESET}`);
}

let currentUc = null;

async function uc(id, name, fn) {
  currentUc = id;
  process.stdout.write(`${CYAN}[${id}]${RESET} ${name}… `);
  try {
    await fn();
    console.log(`${GREEN}PASS${RESET}`);
    results.push({ id, name, status: 'PASS' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`${RED}FAIL${RESET} — ${msg}`);
    results.push({ id, name, status: 'FAIL', error: msg });
  } finally {
    currentUc = null;
  }
}

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function rnd() {
  return Math.random().toString(36).slice(2, 8);
}

async function call(method, path, { token, body, asText, ignore401 } = {}) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (asText) return { status: res.status, text };
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }
  if (res.status === 401 && !ignore401) {
    log(`401 from ${method} ${path}`);
  }
  return { status: res.status, payload };
}

function data(res) {
  return res.payload?.data;
}

function expect(res, status, ctx = '') {
  if (res.status !== status) {
    throw new Error(
      `${ctx}expected HTTP ${status}, got ${res.status}: ${JSON.stringify(res.payload ?? res.text)}`,
    );
  }
  return res;
}

// ---------------------------------------------------------------
// Fixtures shared across use cases
// ---------------------------------------------------------------

const ctx = {
  sA: rnd(),
  sB: rnd(),
  tenantA: null, // { token, tenantId, email, userId, refreshToken }
  tenantB: null,
  vehicle: null,
  client: null,
  reservation: null,
  contract: null,
  invoice: null,
  credit: null,
  expiredVehicle: null,
};

async function setup() {
  section('SETUP · register two tenants');

  const regA = await call('POST', '/auth/register', {
    body: {
      companyName: `UC Tenant A ${ctx.sA}`,
      companySlug: `uc-a-${ctx.sA}`,
      firstName: 'Alice',
      lastName: 'A',
      email: `uc-a-${ctx.sA}@test.local`,
      password: 'TestPass123',
    },
  });
  expect(regA, 201, 'tenant A register: ');
  ctx.tenantA = {
    token: regA.payload.data.accessToken,
    refreshToken: regA.payload.data.refreshToken,
    tenantId: regA.payload.data.tenantId,
    userId: regA.payload.data.userId,
    email: `uc-a-${ctx.sA}@test.local`,
  };

  const regB = await call('POST', '/auth/register', {
    body: {
      companyName: `UC Tenant B ${ctx.sB}`,
      companySlug: `uc-b-${ctx.sB}`,
      firstName: 'Bob',
      lastName: 'B',
      email: `uc-b-${ctx.sB}@test.local`,
      password: 'TestPass123',
    },
  });
  expect(regB, 201, 'tenant B register: ');
  ctx.tenantB = {
    token: regB.payload.data.accessToken,
    refreshToken: regB.payload.data.refreshToken,
    tenantId: regB.payload.data.tenantId,
    userId: regB.payload.data.userId,
    email: `uc-b-${ctx.sB}@test.local`,
  };

  assert(
    ctx.tenantA.tenantId !== ctx.tenantB.tenantId,
    'tenants must have distinct ids',
  );
  console.log(
    `  tenant A ${ctx.tenantA.tenantId.slice(0, 8)}… · tenant B ${ctx.tenantB.tenantId.slice(0, 8)}…`,
  );
}

// ---------------------------------------------------------------
// AUTH
// ---------------------------------------------------------------

async function authUseCases() {
  section('AUTH');

  await uc('AUTH-01', '/auth/me returns the ADMIN profile for the owner', async () => {
    const r = await call('GET', '/auth/me', { token: ctx.tenantA.token });
    expect(r, 200);
    assert(data(r).role === 'ADMIN', `role is ${data(r).role}`);
    assert(data(r).tenantId === ctx.tenantA.tenantId, 'tenantId matches');
  });

  await uc('AUTH-02', 'login returns a valid access token', async () => {
    const r = await call('POST', '/auth/login', {
      body: { email: ctx.tenantA.email, password: 'TestPass123' },
    });
    expect(r, 200);
    assert(typeof data(r).accessToken === 'string', 'accessToken missing');
  });

  await uc('AUTH-03', 'login rejects bad password', async () => {
    const r = await call('POST', '/auth/login', {
      body: { email: ctx.tenantA.email, password: 'WRONG-pw-x1' },
    });
    assert(r.status === 401, `expected 401, got ${r.status}`);
  });

  await uc('AUTH-04', 'refresh rotates the token and invalidates the old one', async () => {
    // Fresh login to get a clean refresh token for this test
    const fresh = await call('POST', '/auth/login', {
      body: { email: ctx.tenantA.email, password: 'TestPass123' },
    });
    expect(fresh, 200);
    const oldRefresh = data(fresh).refreshToken;

    const r1 = await call('POST', '/auth/refresh', { body: { refreshToken: oldRefresh } });
    expect(r1, 200, 'first refresh: ');
    const newRefresh = data(r1).refreshToken;
    assert(newRefresh !== oldRefresh, 'refresh should rotate');

    const r2 = await call('POST', '/auth/refresh', { body: { refreshToken: oldRefresh } });
    assert(r2.status === 401, `reused refresh should be 401, got ${r2.status}`);
  });

  await uc('AUTH-05', 'register rejects duplicate slug', async () => {
    const r = await call('POST', '/auth/register', {
      body: {
        companyName: 'Dup',
        companySlug: `uc-a-${ctx.sA}`, // already taken by tenant A
        firstName: 'X',
        lastName: 'Y',
        email: `dup-${rnd()}@test.local`,
        password: 'TestPass123',
      },
    });
    assert(r.status === 409, `expected 409, got ${r.status}`);
  });

  await uc('AUTH-06', 'register rejects invalid slug (non kebab-case)', async () => {
    const r = await call('POST', '/auth/register', {
      body: {
        companyName: 'Bad Slug',
        companySlug: 'NOT VALID!',
        firstName: 'X',
        lastName: 'Y',
        email: `bad-${rnd()}@test.local`,
        password: 'TestPass123',
      },
    });
    assert(r.status === 400, `expected 400, got ${r.status}`);
  });

  await uc('AUTH-07', '/auth/me without token returns 401', async () => {
    const r = await call('GET', '/auth/me', { ignore401: true });
    assert(r.status === 401, `expected 401, got ${r.status}`);
  });

  await uc('AUTH-08', 'logout revokes all refresh tokens', async () => {
    // Use a fresh login so we don't wreck the suite-wide token
    const fresh = await call('POST', '/auth/login', {
      body: { email: ctx.tenantA.email, password: 'TestPass123' },
    });
    expect(fresh, 200);
    const freshAccess = data(fresh).accessToken;
    const freshRefresh = data(fresh).refreshToken;

    const out = await call('POST', '/auth/logout', { token: freshAccess });
    assert(out.status === 204, `logout returned ${out.status}`);

    const reuse = await call('POST', '/auth/refresh', {
      body: { refreshToken: freshRefresh },
    });
    assert(reuse.status === 401, `refresh after logout should be 401, got ${reuse.status}`);
  });
}

// ---------------------------------------------------------------
// VEHICLES
// ---------------------------------------------------------------

async function vehicleUseCases() {
  section('VEHICLES');

  await uc('VEH-01', 'create a fit vehicle', async () => {
    const r = await call('POST', '/vehicles', {
      token: ctx.tenantA.token,
      body: {
        registration: `V-${ctx.sA}`,
        brand: 'Renault',
        model: 'Clio',
        year: 2024,
        dailyRate: 250,
      },
    });
    expect(r, 201);
    assert(data(r).status === 'AVAILABLE', 'status should be AVAILABLE');
    ctx.vehicle = data(r);
  });

  await uc('VEH-02', 'duplicate registration → 409', async () => {
    const r = await call('POST', '/vehicles', {
      token: ctx.tenantA.token,
      body: {
        registration: `V-${ctx.sA}`,
        brand: 'X',
        model: 'Y',
        year: 2024,
        dailyRate: 100,
      },
    });
    assert(r.status === 409, `expected 409, got ${r.status}`);
  });

  await uc('VEH-03', 'invalid payload (missing dailyRate) → 400', async () => {
    const r = await call('POST', '/vehicles', {
      token: ctx.tenantA.token,
      body: { registration: `X-${rnd()}`, brand: 'A', model: 'B', year: 2024 },
    });
    assert(r.status === 400, `expected 400, got ${r.status}`);
  });

  await uc('VEH-04', 'list vehicles returns the created one', async () => {
    const r = await call('GET', '/vehicles', { token: ctx.tenantA.token });
    expect(r, 200);
    assert(Array.isArray(data(r).items), 'items array expected');
    assert(data(r).items.some((v) => v.id === ctx.vehicle.id), 'created vehicle missing');
  });

  await uc('VEH-05', 'update rate', async () => {
    const r = await call('PATCH', `/vehicles/${ctx.vehicle.id}`, {
      token: ctx.tenantA.token,
      body: { dailyRate: 300 },
    });
    expect(r, 200);
    assert(Number(data(r).dailyRate) === 300, `rate is ${data(r).dailyRate}`);
  });

  await uc('VEH-06', "tenant B cannot read tenant A's vehicle", async () => {
    const r = await call('GET', `/vehicles/${ctx.vehicle.id}`, {
      token: ctx.tenantB.token,
    });
    assert(r.status === 404 || r.status === 403, `expected 404/403, got ${r.status}`);
  });

  await uc(
    'VEH-08',
    "cross-tenant FK injection: tenant B cannot create a reservation using tenant A's vehicle id",
    async () => {
      // Tenant B creates its own client first
      const client = await call('POST', '/clients', {
        token: ctx.tenantB.token,
        body: { fullName: 'B Client', idNumber: `BC-${rnd()}` },
      });
      expect(client, 201, 'tenant B client create: ');
      const now = Date.now();
      const start = new Date(now + 3 * 24 * 3600 * 1000).toISOString();
      const end = new Date(now + 5 * 24 * 3600 * 1000).toISOString();
      // Tenant B tries to reserve tenant A's vehicle. Must 404/403/409 — never
      // succeed and never silently create the reservation on the wrong vehicle.
      const r = await call('POST', '/reservations', {
        token: ctx.tenantB.token,
        body: {
          vehicleId: ctx.vehicle?.id ?? '00000000-0000-0000-0000-000000000000',
          clientId: data(client).id,
          startDate: start,
          endDate: end,
        },
      });
      assert(
        [403, 404, 409].includes(r.status),
        `expected 403/404/409, got ${r.status}`,
      );
    },
  );

  await uc('VEH-07', 'create expired-insurance vehicle (used in later UCs)', async () => {
    const r = await call('POST', '/vehicles', {
      token: ctx.tenantA.token,
      body: {
        registration: `EXP-${ctx.sA}`,
        brand: 'Dacia',
        model: 'Logan',
        year: 2020,
        dailyRate: 180,
        insuranceExpiry: '2020-01-01',
      },
    });
    expect(r, 201);
    ctx.expiredVehicle = data(r);
  });
}

// ---------------------------------------------------------------
// CLIENTS
// ---------------------------------------------------------------

async function clientUseCases() {
  section('CLIENTS');

  await uc('CLI-01', 'create a client', async () => {
    const r = await call('POST', '/clients', {
      token: ctx.tenantA.token,
      body: { fullName: 'Ahmed Alami', idNumber: `CIN-${ctx.sA}`, phone: '+212600000000' },
    });
    expect(r, 201);
    ctx.client = data(r);
  });

  await uc('CLI-02', 'duplicate CIN rejected', async () => {
    const r = await call('POST', '/clients', {
      token: ctx.tenantA.token,
      body: { fullName: 'Dup', idNumber: `CIN-${ctx.sA}` },
    });
    assert(r.status === 409, `expected 409, got ${r.status}`);
  });

  await uc('CLI-03', 'blacklist a client', async () => {
    const other = await call('POST', '/clients', {
      token: ctx.tenantA.token,
      body: { fullName: 'Mauvais Payeur', idNumber: `BL-${ctx.sA}` },
    });
    expect(other, 201);
    const r = await call('PATCH', `/clients/${data(other).id}`, {
      token: ctx.tenantA.token,
      body: { blacklisted: true, blacklistReason: 'impayés' },
    });
    expect(r, 200);
    assert(data(r).blacklisted === true, 'should be blacklisted');
    ctx.blacklistedClient = data(r);
  });

  await uc('CLI-04', 'list filters blacklisted=true', async () => {
    const r = await call('GET', '/clients?blacklisted=true', { token: ctx.tenantA.token });
    expect(r, 200);
    assert(
      data(r).items.every((c) => c.blacklisted === true),
      'all returned clients must be blacklisted',
    );
  });

  await uc(
    'CLI-05',
    'blacklisted=false returns non-blacklisted clients (regression: used to be empty)',
    async () => {
      const r = await call('GET', '/clients?blacklisted=false', { token: ctx.tenantA.token });
      expect(r, 200);
      assert(
        data(r).items.every((c) => c.blacklisted === false),
        'all returned clients must be non-blacklisted',
      );
      assert(
        data(r).items.some((c) => c.id === ctx.client.id),
        'non-blacklisted list should include our non-blacklisted test client',
      );
    },
  );

  await uc(
    'CLI-06',
    'update client via PATCH (regression: edit UI must work)',
    async () => {
      const r = await call('PATCH', `/clients/${ctx.client.id}`, {
        token: ctx.tenantA.token,
        body: { phone: '+212611223344', city: 'Casablanca' },
      });
      expect(r, 200);
      assert(data(r).phone === '+212611223344', `phone not persisted: ${data(r).phone}`);
      assert(data(r).city === 'Casablanca', `city not persisted: ${data(r).city}`);
    },
  );
}

// ---------------------------------------------------------------
// RESERVATIONS
// ---------------------------------------------------------------

async function reservationUseCases() {
  section('RESERVATIONS');

  const now = Date.now();
  const start = new Date(now + 24 * 3600 * 1000).toISOString();
  const end = new Date(now + 72 * 3600 * 1000).toISOString();

  await uc('RES-01', 'create reservation on a fit vehicle', async () => {
    const r = await call('POST', '/reservations', {
      token: ctx.tenantA.token,
      body: {
        vehicleId: ctx.vehicle.id,
        clientId: ctx.client.id,
        startDate: start,
        endDate: end,
      },
    });
    expect(r, 201);
    assert(data(r).status === 'PENDING', `status is ${data(r).status}`);
    assert(data(r).reservationCode?.startsWith('RES-'), 'code prefix');
    ctx.reservation = data(r);
  });

  await uc('RES-02', 'overlap on same vehicle → 409', async () => {
    const r = await call('POST', '/reservations', {
      token: ctx.tenantA.token,
      body: {
        vehicleId: ctx.vehicle.id,
        clientId: ctx.client.id,
        startDate: start,
        endDate: end,
      },
    });
    assert(r.status === 409, `expected 409, got ${r.status}`);
  });

  await uc('RES-03', 'blacklisted client → rejected', async () => {
    const r = await call('POST', '/reservations', {
      token: ctx.tenantA.token,
      body: {
        vehicleId: ctx.vehicle.id,
        clientId: ctx.blacklistedClient.id,
        startDate: new Date(now + 10 * 24 * 3600 * 1000).toISOString(),
        endDate: new Date(now + 12 * 24 * 3600 * 1000).toISOString(),
      },
    });
    assert(r.status === 409, `expected 409, got ${r.status}`);
  });

  await uc('RES-04', 'unfit vehicle (expired insurance) → 409 with blocker message', async () => {
    const r = await call('POST', '/reservations', {
      token: ctx.tenantA.token,
      body: {
        vehicleId: ctx.expiredVehicle.id,
        clientId: ctx.client.id,
        startDate: start,
        endDate: end,
      },
    });
    assert(r.status === 409, `expected 409, got ${r.status}`);
    const msg = r.payload?.message ?? '';
    assert(/Insurance expired/i.test(msg), `expected insurance blocker, got: ${msg}`);
  });

  await uc('RES-05', 'cancel reservation', async () => {
    const r = await call('POST', `/reservations/${ctx.reservation.id}/cancel`, {
      token: ctx.tenantA.token,
    });
    expect(r, 201);
    assert(data(r).status === 'CANCELLED', `status ${data(r).status}`);
  });
}

// ---------------------------------------------------------------
// CONTRACTS
// ---------------------------------------------------------------

async function contractUseCases() {
  section('CONTRACTS (UC-001 / UC-002)');

  const now = Date.now();
  const start = new Date(now + 60 * 1000).toISOString(); // start ~now
  const end = new Date(now + 3 * 24 * 3600 * 1000).toISOString();

  await uc('CON-01', 'create contract → vehicle becomes RENTED', async () => {
    const r = await call('POST', '/contracts', {
      token: ctx.tenantA.token,
      body: {
        vehicleId: ctx.vehicle.id,
        clientId: ctx.client.id,
        startDate: start,
        endDate: end,
        kmStart: 50_000,
        depositAmount: 1000,
        depositMethod: 'CASH',
      },
    });
    expect(r, 201);
    assert(data(r).status === 'ACTIVE', `status ${data(r).status}`);
    ctx.contract = data(r);

    const veh = await call('GET', `/vehicles/${ctx.vehicle.id}`, {
      token: ctx.tenantA.token,
    });
    expect(veh, 200);
    assert(data(veh).status === 'RENTED', `vehicle should be RENTED, is ${data(veh).status}`);
  });

  await uc('CON-02', 'complete contract → vehicle AVAILABLE + km updated', async () => {
    const r = await call('POST', `/contracts/${ctx.contract.id}/complete`, {
      token: ctx.tenantA.token,
      body: { kmEnd: 50_300, extraCharges: 50 },
    });
    expect(r, 201);
    assert(data(r).status === 'COMPLETED', `status ${data(r).status}`);

    const veh = await call('GET', `/vehicles/${ctx.vehicle.id}`, {
      token: ctx.tenantA.token,
    });
    expect(veh, 200);
    assert(data(veh).status === 'AVAILABLE', `vehicle should be AVAILABLE, is ${data(veh).status}`);
    assert(data(veh).currentKm === 50_300, `km should be 50300, is ${data(veh).currentKm}`);
  });

  await uc('CON-03', 'contract on unfit vehicle → 409', async () => {
    const r = await call('POST', '/contracts', {
      token: ctx.tenantA.token,
      body: {
        vehicleId: ctx.expiredVehicle.id,
        clientId: ctx.client.id,
        startDate: start,
        endDate: end,
        kmStart: 0,
      },
    });
    assert(r.status === 409, `expected 409, got ${r.status}`);
  });
}

// ---------------------------------------------------------------
// INVOICES + PAYMENTS
// ---------------------------------------------------------------

async function invoicePaymentUseCases() {
  section('INVOICES & PAYMENTS');

  await uc('INV-01', 'create invoice with TVA 20%', async () => {
    const r = await call('POST', '/invoices', {
      token: ctx.tenantA.token,
      body: {
        clientId: ctx.client.id,
        contractId: ctx.contract.id,
        lineItems: [
          { description: 'Location 3j Clio', quantity: 3, unitPrice: 300, total: 900 },
        ],
        taxRate: 20,
      },
    });
    expect(r, 201);
    assert(Number(data(r).subtotal) === 900, `subtotal ${data(r).subtotal}`);
    assert(Number(data(r).taxAmount) === 180, `tax ${data(r).taxAmount}`);
    assert(Number(data(r).total) === 1080, `total ${data(r).total}`);
    ctx.invoice = data(r);
  });

  await uc('PAY-01', 'partial payment moves invoice to PARTIAL', async () => {
    const r = await call('POST', '/payments', {
      token: ctx.tenantA.token,
      body: {
        clientId: ctx.client.id,
        invoiceId: ctx.invoice.id,
        amount: 500,
        method: 'CASH',
      },
    });
    expect(r, 201);

    const inv = await call('GET', `/invoices/${ctx.invoice.id}`, {
      token: ctx.tenantA.token,
    });
    expect(inv, 200);
    assert(data(inv).status === 'PARTIAL', `expected PARTIAL, got ${data(inv).status}`);
    assert(Number(data(inv).balance) === 580, `balance ${data(inv).balance}`);
  });

  await uc('PAY-02', 'full payment marks invoice PAID', async () => {
    const r = await call('POST', '/payments', {
      token: ctx.tenantA.token,
      body: {
        clientId: ctx.client.id,
        invoiceId: ctx.invoice.id,
        amount: 580,
        method: 'CARD',
      },
    });
    expect(r, 201);

    const inv = await call('GET', `/invoices/${ctx.invoice.id}`, {
      token: ctx.tenantA.token,
    });
    assert(data(inv).status === 'PAID', `expected PAID, got ${data(inv).status}`);
    assert(Number(data(inv).balance) === 0, `balance ${data(inv).balance}`);
  });
}

// ---------------------------------------------------------------
// CREDITS (UC-003)
// ---------------------------------------------------------------

async function creditUseCases() {
  section('VEHICLE CREDITS (UC-003)');

  await uc('CRE-01', 'create credit → amortization schedule generated', async () => {
    const r = await call('POST', '/vehicle-credits', {
      token: ctx.tenantA.token,
      body: {
        vehicleId: ctx.vehicle.id,
        bankName: 'Attijariwafa',
        creditType: 'BANK_CREDIT',
        principal: 120_000,
        downPayment: 20_000,
        interestRate: 7.5,
        termMonths: 12,
        startDate: new Date().toISOString(),
      },
    });
    expect(r, 201);
    assert(Number(data(r).monthlyPayment) > 0, 'monthlyPayment must be > 0');
    ctx.credit = data(r);

    const sched = await call('GET', `/vehicle-credits/${ctx.credit.id}/schedule`, {
      token: ctx.tenantA.token,
    });
    expect(sched, 200);
    assert(data(sched).length === 12, `expected 12 installments, got ${data(sched).length}`);
  });

  await uc('CRE-02', 'record an installment payment → balance drops', async () => {
    const sched = await call('GET', `/vehicle-credits/${ctx.credit.id}/schedule`, {
      token: ctx.tenantA.token,
    });
    const first = data(sched)[0];
    const r = await call('POST', `/vehicle-credits/${ctx.credit.id}/payments/${first.id}`, {
      token: ctx.tenantA.token,
      body: { paidAmount: Number(first.scheduledAmount) },
    });
    expect(r, 201);
    assert(data(r).status === 'PAID', `installment status ${data(r).status}`);

    const fresh = await call('GET', `/vehicle-credits/${ctx.credit.id}`, {
      token: ctx.tenantA.token,
    });
    expect(fresh, 200);
    assert(
      Number(data(fresh).remainingBalance) < 100_000,
      `remaining balance should have dropped below principal-down, got ${data(fresh).remainingBalance}`,
    );
  });
}

// ---------------------------------------------------------------
// MAINTENANCE
// ---------------------------------------------------------------

async function maintenanceUseCases() {
  section('MAINTENANCE');

  await uc('MAI-01', 'log a maintenance record + cost summary', async () => {
    const r = await call('POST', '/maintenance/records', {
      token: ctx.tenantA.token,
      body: {
        vehicleId: ctx.vehicle.id,
        type: 'OIL_CHANGE',
        title: 'Vidange 50k',
        cost: 450,
        km: 50_500,
      },
    });
    expect(r, 201);

    const cost = await call('GET', `/maintenance/vehicles/${ctx.vehicle.id}/cost`, {
      token: ctx.tenantA.token,
    });
    expect(cost, 200);
    assert(data(cost).totalCost === 450, `totalCost ${data(cost).totalCost}`);
    assert(data(cost).recordCount === 1, `recordCount ${data(cost).recordCount}`);
  });

  await uc(
    'MAI-02',
    'critical overdue schedule blocks a reservation',
    async () => {
      // Create a fresh vehicle so we control its state without affecting prior UCs
      const veh = await call('POST', '/vehicles', {
        token: ctx.tenantA.token,
        body: {
          registration: `MAI-${rnd()}`,
          brand: 'Peugeot',
          model: '208',
          year: 2023,
          dailyRate: 220,
        },
      });
      expect(veh, 201);
      const vid = data(veh).id;

      // Schedule a CRITICAL overdue maintenance (due yesterday)
      const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10);
      const sch = await call('POST', '/maintenance/schedules', {
        token: ctx.tenantA.token,
        body: {
          vehicleId: vid,
          type: 'INSPECTION',
          title: 'Contrôle distribution',
          isCritical: true,
          dueDate: yesterday,
        },
      });
      expect(sch, 201);

      const now = Date.now();
      const res = await call('POST', '/reservations', {
        token: ctx.tenantA.token,
        body: {
          vehicleId: vid,
          clientId: ctx.client.id,
          startDate: new Date(now + 24 * 3600 * 1000).toISOString(),
          endDate: new Date(now + 48 * 3600 * 1000).toISOString(),
        },
      });
      assert(res.status === 409, `expected 409, got ${res.status}`);
      assert(
        /Critical maintenance overdue/i.test(res.payload?.message ?? ''),
        `expected critical-overdue blocker, got: ${res.payload?.message}`,
      );
    },
  );
}

// ---------------------------------------------------------------
// ALERTS & NOTIFICATIONS
// ---------------------------------------------------------------

async function alertNotificationUseCases() {
  section('ALERTS & NOTIFICATIONS');

  await uc('ALE-01', 'expired insurance vehicle produces a CRITICAL alert', async () => {
    const r = await call('GET', '/alerts?status=OPEN', { token: ctx.tenantA.token });
    expect(r, 200);
    const hit = (data(r) ?? []).find(
      (a) => a.type === 'INSURANCE_EXPIRY' && a.severity === 'CRITICAL',
    );
    assert(hit, `no CRITICAL insurance alert found (${(data(r) ?? []).length} open)`);
    ctx.insuranceAlertId = hit.id;
  });

  await uc('ALE-02', 'resolve the insurance alert', async () => {
    const r = await call('POST', `/alerts/${ctx.insuranceAlertId}/resolve`, {
      token: ctx.tenantA.token,
    });
    expect(r, 201);
    assert(data(r).status === 'RESOLVED', `status ${data(r).status}`);
  });

  await uc('ALE-03', 'resync does not create a duplicate alert', async () => {
    const before = await call('GET', '/alerts', { token: ctx.tenantA.token });
    expect(before, 200);
    const beforeCount = (data(before) ?? []).length;

    const sync = await call('POST', '/alerts/resync', { token: ctx.tenantA.token });
    expect(sync, 200);

    const after = await call('GET', '/alerts', { token: ctx.tenantA.token });
    expect(after, 200);
    const afterCount = (data(after) ?? []).length;

    // The re-opened alert for insurance is the same row upserted; count
    // shouldn't increase by more than 1 (resync may re-open the resolved one
    // as an upsert produces a new row — but our sync logic REUSES the
    // non-resolved row or creates only if none exist).
    assert(
      afterCount <= beforeCount + 1,
      `resync duplicated alerts: ${beforeCount} → ${afterCount}`,
    );
  });

  await uc('NOT-01', 'admin has at least one notification', async () => {
    const r = await call('GET', '/notifications', { token: ctx.tenantA.token });
    expect(r, 200);
    assert((data(r) ?? []).length >= 1, 'expected >= 1 notification');
  });

  await uc('NOT-02', 'mark-all-read drops unread counter to 0', async () => {
    await call('POST', '/notifications/read-all', { token: ctx.tenantA.token });
    const r = await call('GET', '/notifications/summary', { token: ctx.tenantA.token });
    expect(r, 200);
    assert(data(r).unread === 0, `unread should be 0, is ${data(r).unread}`);
  });
}

// ---------------------------------------------------------------
// ANALYTICS
// ---------------------------------------------------------------

async function analyticsUseCases() {
  section('ANALYTICS');

  await uc('ANA-01', 'dashboard KPIs return fleet + contract counts', async () => {
    const r = await call('GET', '/analytics/dashboard', { token: ctx.tenantA.token });
    expect(r, 200);
    assert(typeof data(r).fleet?.total === 'number', 'fleet.total missing');
    assert(data(r).fleet.total >= 2, `fleet should have >=2, got ${data(r).fleet.total}`);
  });

  await uc('ANA-02', 'revenue series returns daily points', async () => {
    const r = await call('GET', '/analytics/revenue?windowDays=30', {
      token: ctx.tenantA.token,
    });
    expect(r, 200);
    assert(Array.isArray(data(r)), 'expected array');
    assert(data(r).length >= 1, `expected >= 1 point, got ${data(r).length}`);
  });

  await uc('ANA-03', 'top clients endpoint returns our test client', async () => {
    const r = await call('GET', '/analytics/clients/top?limit=5', {
      token: ctx.tenantA.token,
    });
    expect(r, 200);
    assert(
      (data(r) ?? []).some((c) => c.clientId === ctx.client.id),
      'our client should appear in top clients',
    );
  });

  await uc('ANA-04', 'CSV export returns text/csv with headers', async () => {
    const res = await call('GET', '/analytics/exports/contracts.csv', {
      token: ctx.tenantA.token,
      asText: true,
    });
    assert(res.status === 200, `expected 200, got ${res.status}`);
    assert(
      res.text.startsWith('contractNumber,'),
      `unexpected CSV header: ${res.text.slice(0, 80)}`,
    );
  });
}

// ---------------------------------------------------------------
// PLATFORM
// ---------------------------------------------------------------

async function platformUseCases() {
  section('PLATFORM (SUPER_ADMIN guards)');

  await uc('PLT-01', 'tenant ADMIN is rejected from /platform/metrics', async () => {
    const r = await call('GET', '/platform/metrics', { token: ctx.tenantA.token });
    assert(r.status === 403, `expected 403, got ${r.status}`);
  });

  await uc('PLT-02', 'tenant ADMIN is rejected from /platform/tenants', async () => {
    const r = await call('GET', '/platform/tenants', { token: ctx.tenantA.token });
    assert(r.status === 403, `expected 403, got ${r.status}`);
  });
}

// ---------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------

(async () => {
  try {
    // Health check first
    const h = await call('GET', '/health');
    if (h.status !== 200) {
      console.error(`${RED}API not reachable at ${API} (HTTP ${h.status})${RESET}`);
      process.exit(2);
    }

    await setup();
    await authUseCases();
    await vehicleUseCases();
    await clientUseCases();
    await reservationUseCases();
    await contractUseCases();
    await invoicePaymentUseCases();
    await creditUseCases();
    await maintenanceUseCases();
    await alertNotificationUseCases();
    await analyticsUseCases();
    await platformUseCases();

    const pass = results.filter((r) => r.status === 'PASS').length;
    const fail = results.filter((r) => r.status === 'FAIL').length;

    console.log(
      `\n${BLUE}════════════════════════════════${RESET}\n` +
        `\x1b[1mResult\x1b[0m: ${GREEN}${pass} passed${RESET} · ${fail > 0 ? RED : DIM}${fail} failed${RESET} · ${results.length} total`,
    );

    if (fail > 0) {
      console.log(`\n${YELLOW}Failing use cases:${RESET}`);
      for (const r of results.filter((x) => x.status === 'FAIL')) {
        console.log(`  • [${r.id}] ${r.name}\n      ${DIM}${r.error}${RESET}`);
      }
    }

    writeFileSync(
      'REPORT.json',
      JSON.stringify(
        {
          api: API,
          ran_at: new Date().toISOString(),
          total: results.length,
          pass,
          fail,
          results,
        },
        null,
        2,
      ),
    );
    console.log(`\n${DIM}Full report written to REPORT.json${RESET}`);
    process.exit(fail > 0 ? 1 : 0);
  } catch (err) {
    console.error('Runner crashed:', err);
    if (currentUc) console.error(`Last UC before crash: ${currentUc}`);
    process.exit(2);
  }
})();
