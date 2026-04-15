# AutoSphere SaaS — Use Cases

Executable catalog of every business use case covered by the automated test
runner at [`scripts/use-cases.mjs`](../scripts/use-cases.mjs). Each row below
maps to one assertion block that runs against a real API on
`localhost:4001` with a real PostgreSQL.

```bash
# Run the full suite. Results are printed and also written to REPORT.json.
node scripts/use-cases.mjs
```

Failures — if any — are captured in [`TEST-ISSUES.md`](./TEST-ISSUES.md) as a
living todo list.

---

## AUTH — 8 use cases

| ID | Use case | Expected |
|----|----------|----------|
| AUTH-01 | `/auth/me` returns the ADMIN profile for the tenant owner | 200 + `role = ADMIN` + matching `tenantId` |
| AUTH-02 | Login returns a valid access token | 200 + `accessToken` + `refreshToken` |
| AUTH-03 | Login rejects bad password | 401 |
| AUTH-04 | Refresh rotates the token and invalidates the old one | new refresh token ≠ old; reusing old returns 401 |
| AUTH-05 | Registration rejects duplicate slug | 409 |
| AUTH-06 | Registration rejects invalid slug (non-kebab-case) | 400 validation error |
| AUTH-07 | `/auth/me` without token returns 401 | 401 |
| AUTH-08 | Logout revokes all refresh tokens (refresh afterwards is 401) | 204 then 401 |

## VEHICLES — 8 use cases

| ID | Use case | Expected |
|----|----------|----------|
| VEH-01 | Create a fit vehicle | 201, status = AVAILABLE |
| VEH-02 | Duplicate registration within a tenant | 409 |
| VEH-03 | Invalid payload (missing `dailyRate`) | 400 |
| VEH-04 | List includes the created vehicle | returned in `items` |
| VEH-05 | Update `dailyRate` via PATCH | 200 + new rate persisted |
| VEH-06 | Tenant B cannot read tenant A's vehicle | 404 or 403 |
| VEH-07 | Create vehicle with expired insurance (used downstream for alerts & booking-blocker UCs) | 201 |
| VEH-08 | Cross-tenant FK injection: tenant B cannot create a reservation against tenant A's vehicle id | 403/404/409 |

## CLIENTS — 6 use cases

| ID | Use case | Expected |
|----|----------|----------|
| CLI-01 | Create a client | 201 |
| CLI-02 | Duplicate CIN within a tenant | 409 |
| CLI-03 | Blacklist a client | `blacklisted = true` persisted |
| CLI-04 | List filter `blacklisted=true` | all returned rows are blacklisted |
| CLI-05 | `blacklisted=false` returns non-blacklisted clients (regression: used to return empty because `@Type(() => Boolean)` coerced `"false"` → `true`) | seeded non-blacklisted client is included |
| CLI-06 | `PATCH /clients/:id` persists edits (backs the new `/clients/[id]` edit UI) | phone + city round-trip |

## RESERVATIONS — 5 use cases

| ID | Use case | Expected |
|----|----------|----------|
| RES-01 | Create reservation on a fit vehicle | 201, status = PENDING, code `RES-YYYY-NNNN` |
| RES-02 | Overlap on same vehicle | 409 |
| RES-03 | Blacklisted client rejected | 409 |
| RES-04 | Unfit vehicle (expired insurance) rejected with descriptive message | 409 + `Insurance expired` in message |
| RES-05 | Cancel reservation | status becomes CANCELLED |

## CONTRACTS — UC-001 / UC-002 from the spec

| ID | Use case | Expected |
|----|----------|----------|
| CON-01 | **UC-001** Create contract → vehicle flips to RENTED | 201 + vehicle status = RENTED |
| CON-02 | **UC-002** Complete contract → vehicle becomes AVAILABLE + `currentKm` updated | status = COMPLETED + vehicle km updated |
| CON-03 | Contract on unfit vehicle | 409 |

## INVOICES & PAYMENTS — 3 use cases

| ID | Use case | Expected |
|----|----------|----------|
| INV-01 | Create invoice with TVA 20% line items | subtotal/tax/total computed correctly |
| PAY-01 | Partial payment moves invoice to PARTIAL | invoice.status = PARTIAL, balance decremented |
| PAY-02 | Full payment marks invoice PAID | invoice.status = PAID, balance = 0 |

## VEHICLE CREDITS — UC-003 from the spec

| ID | Use case | Expected |
|----|----------|----------|
| CRE-01 | **UC-003** Create credit generates a complete amortization schedule | termMonths rows, monthlyPayment > 0 |
| CRE-02 | Record an installment payment drops the remaining balance | installment = PAID, credit.remainingBalance < principal − downPayment |

## MAINTENANCE — 2 use cases

| ID | Use case | Expected |
|----|----------|----------|
| MAI-01 | Log a maintenance record and read the cost summary | `totalCost` and `recordCount` reflect the record |
| MAI-02 | A CRITICAL overdue schedule blocks a new reservation on that vehicle | 409 + `Critical maintenance overdue` in message |

## ALERTS & NOTIFICATIONS — 5 use cases

| ID | Use case | Expected |
|----|----------|----------|
| ALE-01 | Expired insurance on a vehicle produces a CRITICAL `INSURANCE_EXPIRY` alert | alert exists with the right type and severity |
| ALE-02 | Resolve the alert | status = RESOLVED |
| ALE-03 | Resync does not create duplicate alerts | alert count does not grow unexpectedly |
| NOT-01 | Admin has at least one notification (from alert fan-out) | `>= 1` notification in inbox |
| NOT-02 | Mark-all-read drops the unread counter to 0 | summary.unread = 0 |

## ANALYTICS — 4 use cases

| ID | Use case | Expected |
|----|----------|----------|
| ANA-01 | Dashboard KPIs include fleet and contract totals | `fleet.total >= 2` after seeding |
| ANA-02 | Revenue series returns daily points for a 30-day window | non-empty array |
| ANA-03 | Top clients endpoint surfaces the seeded client | the created client appears |
| ANA-04 | CSV export returns `text/csv` with the expected header line | starts with `contractNumber,` |

## PLATFORM — 2 use cases

| ID | Use case | Expected |
|----|----------|----------|
| PLT-01 | A tenant ADMIN is rejected from `/platform/metrics` | 403 |
| PLT-02 | A tenant ADMIN is rejected from `/platform/tenants` | 403 |

Positive super-admin paths (list, suspend, activate, extend trial) are
validated manually after running the `promote-superadmin` script — see
[Phase 5 notes in the commit log](https://github.com/achrafhabbass/car-rental-saas/commits/claude/youthful-bell).

---

## Re-running the suite

```bash
# Prerequisites
docker compose up -d postgres
pnpm --filter @autosphere/api run start:prod &

# Run
node scripts/use-cases.mjs

# Verbose (show one log line per request)
VERBOSE=1 node scripts/use-cases.mjs

# Against a non-default host
API_URL=https://staging.example.com/api/v1 node scripts/use-cases.mjs
```

The runner is idempotent: every run registers fresh tenants with random
slugs, so it will not collide with prior runs — and it does not clean up
test data, which makes it easy to inspect state in the dashboard afterwards.
