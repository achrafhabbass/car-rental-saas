#!/usr/bin/env node
/**
 * AutoSphere SaaS — end-to-end smoke test.
 * Exercises the public API and validates the core invariants:
 *   - register → tenant + ADMIN created, tokens returned
 *   - GET /auth/me returns the fresh profile
 *   - Multi-tenant isolation: tenant A can't read tenant B's vehicle
 *   - RBAC: ADMIN can delete; platform routes reject tenant ADMINs
 *   - Alerts: expired insurance → CRITICAL alert + admin notification
 *   - Analytics: /analytics/dashboard returns real KPIs
 *
 * Usage:  node scripts/smoke-test.mjs
 *         API_URL=http://localhost:4001/api/v1 node scripts/smoke-test.mjs
 */
const API = process.env.API_URL ?? 'http://localhost:4001/api/v1';

let pass = 0;
let fail = 0;
const failures = [];

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const BLUE = '\x1b[1;34m';
const RESET = '\x1b[0m';

function say(msg) {
  console.log(`\n${BLUE}▶ ${msg}${RESET}`);
}
function ok(msg) {
  console.log(`  ${GREEN}✓${RESET} ${msg}`);
  pass++;
}
function bad(msg) {
  console.log(`  ${RED}✗${RESET} ${msg}`);
  fail++;
  failures.push(msg);
}

function rnd() {
  return Math.random().toString(36).slice(2, 8);
}

async function call(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    // non-JSON body (e.g. CSV) — return raw
    return { status: res.status, raw: text };
  }
  return { status: res.status, payload };
}

async function main() {
  // ---- Health ----
  say('Health check');
  const health = await call('GET', '/health');
  if (health.status === 200 && health.payload?.data?.status === 'ok') {
    ok('API reports database up');
  } else {
    bad(`Health not ok: ${health.status}`);
    return;
  }

  // ---- Register tenant A ----
  say('Register tenant A (admin)');
  const sA = rnd();
  const emailA = `smoke-a-${sA}@test.local`;
  const regA = await call('POST', '/auth/register', {
    body: {
      companyName: `Smoke A ${sA}`,
      companySlug: `smoke-a-${sA}`,
      firstName: 'Alice',
      lastName: 'A',
      email: emailA,
      password: 'TestPass123',
    },
  });
  const tokenA = regA.payload?.data?.accessToken;
  const tenantA = regA.payload?.data?.tenantId;
  if (tokenA && tenantA) {
    ok(`Tenant A created (${tenantA.slice(0, 8)}…)`);
  } else {
    bad(`Tenant A registration failed (${regA.status}): ${JSON.stringify(regA.payload)}`);
    return;
  }

  // ---- GET /auth/me ----
  say('GET /auth/me');
  const me = await call('GET', '/auth/me', { token: tokenA });
  if (me.payload?.data?.role === 'ADMIN') {
    ok('/me returns ADMIN for freshly registered owner');
  } else {
    bad(`/me returned role=${me.payload?.data?.role}`);
  }

  // ---- Create a vehicle in tenant A ----
  say('Tenant A: create a vehicle');
  const veh = await call('POST', '/vehicles', {
    token: tokenA,
    body: {
      registration: `A-${sA}`,
      brand: 'Renault',
      model: 'Clio',
      year: 2024,
      dailyRate: 250,
    },
  });
  const vehicleId = veh.payload?.data?.id;
  if (vehicleId) {
    ok(`Vehicle created (${vehicleId.slice(0, 8)}…)`);
  } else {
    bad(`Vehicle creation failed (${veh.status}): ${JSON.stringify(veh.payload)}`);
  }

  // ---- Register tenant B ----
  say('Register tenant B (admin)');
  const sB = rnd();
  const emailB = `smoke-b-${sB}@test.local`;
  const regB = await call('POST', '/auth/register', {
    body: {
      companyName: `Smoke B ${sB}`,
      companySlug: `smoke-b-${sB}`,
      firstName: 'Bob',
      lastName: 'B',
      email: emailB,
      password: 'TestPass123',
    },
  });
  const tokenB = regB.payload?.data?.accessToken;
  const tenantB = regB.payload?.data?.tenantId;
  if (tokenB && tenantB && tenantB !== tenantA) {
    ok(`Tenant B created with distinct tenantId (${tenantB.slice(0, 8)}…)`);
  } else {
    bad(`Tenant B registration failed: ${JSON.stringify(regB.payload)}`);
  }

  // ---- Multi-tenant isolation ----
  say("Cross-tenant isolation: B tries to read A's vehicle");
  if (vehicleId && tokenB) {
    const iso = await call('GET', `/vehicles/${vehicleId}`, { token: tokenB });
    if (iso.status === 404 || iso.status === 403) {
      ok(`Tenant B blocked (HTTP ${iso.status})`);
    } else {
      bad(`Tenant B got unexpected response: ${iso.status} ${JSON.stringify(iso.payload)}`);
    }
  }

  // ---- Login returns ADMIN ----
  say('Login returns ADMIN');
  const loginA = await call('POST', '/auth/login', {
    body: { email: emailA, password: 'TestPass123' },
  });
  if (loginA.payload?.data?.accessToken) {
    const freshToken = loginA.payload.data.accessToken;
    const meAgain = await call('GET', '/auth/me', { token: freshToken });
    if (meAgain.payload?.data?.role === 'ADMIN') {
      ok('Login → /me returns ADMIN');
    } else {
      bad(`Login → /me returned role=${meAgain.payload?.data?.role}`);
    }
  } else {
    bad(`Login failed: ${JSON.stringify(loginA.payload)}`);
  }

  // ---- RBAC: ADMIN can delete ----
  say('RBAC: ADMIN can delete their own vehicle');
  if (vehicleId) {
    const del = await fetch(`${API}/vehicles/${vehicleId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    if (del.status === 204) {
      ok('ADMIN delete returned 204');
    } else {
      bad(`ADMIN delete returned HTTP ${del.status}`);
    }
  }

  // ---- Refresh token rotation ----
  say('Refresh token rotation');
  const refreshToken1 = regA.payload?.data?.refreshToken;
  const ref1 = await call('POST', '/auth/refresh', {
    body: { refreshToken: refreshToken1 },
  });
  const refreshToken2 = ref1.payload?.data?.refreshToken;
  if (refreshToken2 && refreshToken2 !== refreshToken1) {
    ok('Refresh issued a new token');
    // Reusing the old refresh token should now fail (rotation)
    const reuse = await call('POST', '/auth/refresh', {
      body: { refreshToken: refreshToken1 },
    });
    if (reuse.status === 401) {
      ok('Old refresh token rejected after rotation');
    } else {
      bad(`Old refresh token reuse returned HTTP ${reuse.status}`);
    }
  } else {
    bad(`Refresh did not rotate token: ${JSON.stringify(ref1.payload)}`);
  }

  // ---- Alerts from expired insurance ----
  say('Alerts: vehicle with expired insurance → CRITICAL alert');
  const expired = await call('POST', '/vehicles', {
    token: tokenA,
    body: {
      registration: `EXP-${sA}`,
      brand: 'Dacia',
      model: 'Logan',
      year: 2020,
      dailyRate: 180,
      insuranceExpiry: '2020-01-01',
    },
  });
  if (expired.payload?.data?.id) {
    // Small delay to let async alert sync settle (it's awaited server-side but
    // the test is defensive).
    await new Promise((r) => setTimeout(r, 500));
    const alerts = await call('GET', '/alerts?status=OPEN', { token: tokenA });
    const hit = (alerts.payload?.data ?? []).find(
      (a) => a.type === 'INSURANCE_EXPIRY' && a.severity === 'CRITICAL',
    );
    if (hit) {
      ok('CRITICAL INSURANCE_EXPIRY alert raised');
    } else {
      bad(`No CRITICAL insurance alert. Got: ${JSON.stringify(alerts.payload?.data)}`);
    }
  }

  // ---- Business rule: booking blocked on unfit vehicle ----
  say('Booking blocker: cannot reserve an unfit vehicle');
  const expVehicleId = expired.payload?.data?.id;
  if (expVehicleId) {
    // Need a client to reserve
    const client = await call('POST', '/clients', {
      token: tokenA,
      body: { fullName: 'Smoke Client', idNumber: `CIN${sA}` },
    });
    const clientId = client.payload?.data?.id;
    if (clientId) {
      const now = new Date();
      const start = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();
      const end = new Date(now.getTime() + 72 * 3600 * 1000).toISOString();
      const res = await call('POST', '/reservations', {
        token: tokenA,
        body: { vehicleId: expVehicleId, clientId, startDate: start, endDate: end },
      });
      if (res.status === 409) {
        ok(`Reservation rejected (HTTP 409): ${res.payload?.message?.slice(0, 60)}…`);
      } else {
        bad(`Reservation should have been rejected, got HTTP ${res.status}`);
      }
    } else {
      bad(`Could not create test client: ${JSON.stringify(client.payload)}`);
    }
  }

  // ---- Notifications for admin ----
  say('Notifications: admin sees at least one notification');
  const notifs = await call('GET', '/notifications', { token: tokenA });
  const n = (notifs.payload?.data ?? []).length;
  if (n >= 1) {
    ok(`${n} notification(s) in the admin inbox`);
  } else {
    bad('No notifications visible to admin');
  }

  // ---- Analytics dashboard ----
  say('Analytics: /analytics/dashboard returns KPIs');
  const kpi = await call('GET', '/analytics/dashboard', { token: tokenA });
  const fleet = kpi.payload?.data?.fleet?.total;
  if (typeof fleet === 'number' && fleet >= 1) {
    ok(`Dashboard returns fleet.total=${fleet}`);
  } else {
    bad(`Dashboard KPIs malformed: ${JSON.stringify(kpi.payload)}`);
  }

  // ---- Platform guard ----
  say('Platform guard: tenant ADMIN is rejected from /platform/metrics');
  const plat = await call('GET', '/platform/metrics', { token: tokenA });
  if (plat.status === 403) {
    ok('Tenant ADMIN gets 403 on /platform (SUPER_ADMIN-only)');
  } else {
    bad(`Unexpected response on /platform: HTTP ${plat.status}`);
  }

  // ---- Throttler ----
  say('Rate-limiting: login throttled at 10/min');
  let throttled = false;
  for (let i = 0; i < 12; i++) {
    const r = await call('POST', '/auth/login', {
      body: { email: 'nope@nope.local', password: 'wrong-pw' },
    });
    if (r.status === 429) {
      throttled = true;
      break;
    }
  }
  if (throttled) {
    ok('Login endpoint returns 429 after the configured burst');
  } else {
    bad('Login endpoint not throttled after 12 rapid attempts');
  }

  // ---- Summary ----
  console.log('');
  console.log(`\x1b[1mResult:\x1b[0m ${pass} passed, ${fail} failed`);
  if (fail > 0) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  - ${f}`);
  }
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exit(2);
});
