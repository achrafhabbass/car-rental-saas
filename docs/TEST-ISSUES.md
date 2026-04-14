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

- **Guard order regression** — `TenantGuard` ran before `JwtAuthGuard`, so
  every authenticated non-`@AllowNoTenant` route threw "User is not
  associated with any tenant" because `req.user` wasn't populated.
  Fixed in commit `9e06c48` by consolidating all `APP_GUARD` registrations
  in `AppModule` in explicit order (JwtAuth → Throttler → Tenant → Roles).
- **`/auth/refresh` 500** — `createRefreshToken` was called twice per
  refresh (once in `issueTokens`, once explicitly), violating the
  `tokenHash` unique constraint. Fixed in commit `9e06c48` by looking up
  the row `issueTokens` persists instead of inserting again.
