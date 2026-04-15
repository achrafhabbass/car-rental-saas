# Test Issues — open todo list

Any use case in [`USE-CASES.md`](./USE-CASES.md) that fails against the live
API lands here as an actionable todo item. Re-runs overwrite the section
below; solved items should be moved to the **Resolved** section with a link
to the commit that fixed them.

## How to populate this file

```bash
node scripts/use-cases.mjs
# review REPORT.json — every { status: 'FAIL' } entry should become a
# todo item below until it's resolved.
```

Template for an open item:

```md
### [UC-ID] Short title
- **Expected**: <what should happen per the use case>
- **Actual**: <HTTP status + message from REPORT.json>
- **Hypothesis**: <where the bug likely lives>
- **Owner**: unassigned
- **Next step**: <1 concrete action>
```

---

## Open

_No open issues._

_Last full suite run: see `REPORT.json` at the repo root._

---

## Resolved

### Phase 6 QA (commit `9e06c48`)

- **Guard order regression** — `TenantGuard` ran before `JwtAuthGuard`, so
  every authenticated non-`@AllowNoTenant` route threw "User is not
  associated with any tenant" because `req.user` wasn't populated.
  Fixed by consolidating all `APP_GUARD` registrations in `AppModule` in
  explicit order (JwtAuth → Throttler → Tenant → Roles).
- **`/auth/refresh` 500** — `createRefreshToken` was called twice per
  refresh (once in `issueTokens`, once explicitly), violating the
  `tokenHash` unique constraint. Fixed by looking up the row `issueTokens`
  persists instead of inserting again.

### User-reported batch 2026-04-15

- **Boolean query-string filter silently inverted** — the `blacklisted`
  filter on `ListClientsDto` used `@Type(() => Boolean)`, which calls
  `Boolean("false")`; non-empty strings are truthy, so `?blacklisted=false`
  became `true` on the server. Every reservation / contract / invoice /
  payment form filtered the client list with this parameter and therefore
  saw an empty dropdown for fresh tenants. Fixed by adding a shared
  `@ToBoolean()` transformer that properly parses `"true" / "false" / "1" / "0"`
  and by dropping the now-redundant client-side filter (the API already
  refuses blacklisted clients via `assertNotBlacklisted`). New regression
  test `CLI-05` locks in the correct behaviour.
- **No vehicle edit UI** — the list linked to view only. Added
  `/vehicles/[id]` with a full edit form, role-gated save (ADMIN/MANAGER)
  and delete (ADMIN). The list's registration column is now a link to the
  edit page. Covered by existing `VEH-05` (PATCH) + new UI.
- **No client edit UI** — same fix: added `/clients/[id]` with edit form,
  blacklist toggle, delete. List "name" column is now a link. New
  regression test `CLI-06` locks in `PATCH /clients/:id` persistence.
