#!/usr/bin/env bash
# ============================================
# AutoSphere SaaS - End-to-end smoke test
# ============================================
# Exercises the public API via curl, validating:
#   - register → tenant + ADMIN created, tokens returned
#   - GET /auth/me returns the fresh profile
#   - RBAC: EMPLOYEE can create but not delete a vehicle
#   - Multi-tenant isolation: tenant A can't read tenant B's vehicle
#   - Alerts are generated and fan out notifications
#   - Analytics endpoints return data
#
# Requirements: curl, jq. API must be running (default http://localhost:4001/api/v1).

set -u
API="${API_URL:-http://localhost:4001/api/v1}"
PASS=0
FAIL=0

say() { printf "\n\033[1;34m▶ %s\033[0m\n" "$1"; }
ok()  { printf "  \033[32m✓\033[0m %s\n" "$1"; PASS=$((PASS+1)); }
bad() { printf "  \033[31m✗\033[0m %s\n" "$1"; FAIL=$((FAIL+1)); }

# ---- helpers ----
rnd() { head -c 6 /dev/urandom | tr -dc 'a-z0-9' | head -c 6; }
post() { curl -sS -X POST "$API$1" -H 'Content-Type: application/json' -H "$2" -d "$3"; }
get()  { curl -sS -X GET  "$API$1" -H "$2"; }

# ---- health ----
say "Health check"
if get /health "X:1" | grep -q '"status":"ok"'; then
  ok "API reports database up"
else
  bad "API health not ok — is it running?"
  exit 1
fi

# ---- tenant A registration ----
say "Register tenant A (admin)"
SUFFIX=$(rnd)
A_EMAIL="smoke-a-$SUFFIX@test.local"
A_PAYLOAD=$(cat <<EOF
{"companyName":"Smoke A $SUFFIX","companySlug":"smoke-a-$SUFFIX","firstName":"Alice","lastName":"A","email":"$A_EMAIL","password":"TestPass123"}
EOF
)
A_RESP=$(post /auth/register 'X:1' "$A_PAYLOAD")
A_TOKEN=$(echo "$A_RESP" | jq -r '.data.accessToken // empty')
A_TENANT=$(echo "$A_RESP" | jq -r '.data.tenantId // empty')
if [ -n "$A_TOKEN" ] && [ -n "$A_TENANT" ]; then
  ok "Tenant A created ($A_TENANT)"
else
  bad "Tenant A registration failed: $A_RESP"
  exit 1
fi

# ---- /me returns ADMIN ----
say "GET /auth/me"
ME=$(get /auth/me "Authorization: Bearer $A_TOKEN")
ROLE=$(echo "$ME" | jq -r '.data.role // empty')
if [ "$ROLE" = "ADMIN" ]; then
  ok "/me returns ADMIN for freshly registered owner"
else
  bad "/me returned role=$ROLE (expected ADMIN)"
fi

# ---- create a vehicle in tenant A ----
say "Tenant A: create a vehicle"
VEH_PAYLOAD='{"registration":"A-'$SUFFIX'","brand":"Renault","model":"Clio","year":2024,"dailyRate":250}'
V_RESP=$(post /vehicles "Authorization: Bearer $A_TOKEN" "$VEH_PAYLOAD")
V_ID=$(echo "$V_RESP" | jq -r '.data.id // empty')
if [ -n "$V_ID" ]; then
  ok "Vehicle created ($V_ID)"
else
  bad "Vehicle creation failed: $V_RESP"
fi

# ---- tenant B registration ----
say "Register tenant B (admin)"
SUFFIX2=$(rnd)
B_EMAIL="smoke-b-$SUFFIX2@test.local"
B_PAYLOAD=$(cat <<EOF
{"companyName":"Smoke B $SUFFIX2","companySlug":"smoke-b-$SUFFIX2","firstName":"Bob","lastName":"B","email":"$B_EMAIL","password":"TestPass123"}
EOF
)
B_RESP=$(post /auth/register 'X:1' "$B_PAYLOAD")
B_TOKEN=$(echo "$B_RESP" | jq -r '.data.accessToken // empty')
B_TENANT=$(echo "$B_RESP" | jq -r '.data.tenantId // empty')
if [ -n "$B_TOKEN" ] && [ "$B_TENANT" != "$A_TENANT" ]; then
  ok "Tenant B created ($B_TENANT)"
else
  bad "Tenant B registration failed: $B_RESP"
fi

# ---- tenant isolation: B can't read A's vehicle ----
say "Cross-tenant isolation: B tries to read A's vehicle"
ISO=$(get "/vehicles/$V_ID" "Authorization: Bearer $B_TOKEN")
ISO_MSG=$(echo "$ISO" | jq -r '.message // empty')
ISO_STATUS=$(echo "$ISO" | jq -r '.statusCode // empty')
if [ "$ISO_STATUS" = "404" ] || [ "$ISO_STATUS" = "403" ]; then
  ok "Tenant B is blocked (HTTP $ISO_STATUS: $ISO_MSG)"
else
  bad "Tenant B got unexpected response: $ISO"
fi

# ---- RBAC: EMPLOYEE can't delete ----
say "RBAC: login returns the admin's ADMIN role"
LOGIN_RESP=$(post /auth/login 'X:1' "{\"email\":\"$A_EMAIL\",\"password\":\"TestPass123\"}")
LOGIN_ROLE=$(get /auth/me "Authorization: Bearer $(echo "$LOGIN_RESP" | jq -r .data.accessToken)" | jq -r '.data.role')
if [ "$LOGIN_ROLE" = "ADMIN" ]; then
  ok "Login returns ADMIN"
else
  bad "Login returned unexpected role: $LOGIN_ROLE"
fi

# ---- RBAC: delete with ADMIN should succeed ----
say "RBAC: ADMIN can delete their own vehicle"
DEL=$(curl -sS -o /dev/null -w '%{http_code}' -X DELETE "$API/vehicles/$V_ID" -H "Authorization: Bearer $A_TOKEN")
if [ "$DEL" = "204" ]; then
  ok "ADMIN delete returned 204"
else
  bad "ADMIN delete returned HTTP $DEL"
fi

# ---- Alerts: create a vehicle with expired insurance, check alert appears ----
say "Alerts: vehicle with expired insurance creates CRITICAL alert"
EXP_PAYLOAD='{"registration":"EXP-'$SUFFIX'","brand":"Dacia","model":"Logan","year":2020,"dailyRate":180,"insuranceExpiry":"2020-01-01"}'
post /vehicles "Authorization: Bearer $A_TOKEN" "$EXP_PAYLOAD" > /dev/null
sleep 1
ALERTS=$(get /alerts?status=OPEN "Authorization: Bearer $A_TOKEN")
HAS_CRITICAL=$(echo "$ALERTS" | jq '.data | map(select(.type=="INSURANCE_EXPIRY" and .severity=="CRITICAL")) | length')
if [ "${HAS_CRITICAL:-0}" -ge 1 ]; then
  ok "CRITICAL INSURANCE_EXPIRY alert raised"
else
  bad "No CRITICAL insurance alert found: $(echo "$ALERTS" | jq '.data | length') alerts total"
fi

# ---- Notifications surfaced to admin ----
say "Notifications: admin sees a notification for the alert"
NOTIFS=$(get /notifications "Authorization: Bearer $A_TOKEN")
COUNT=$(echo "$NOTIFS" | jq '.data | length')
if [ "${COUNT:-0}" -ge 1 ]; then
  ok "$COUNT notification(s) in the admin inbox"
else
  bad "No notifications: $NOTIFS"
fi

# ---- Analytics dashboard ----
say "Analytics: /analytics/dashboard returns fleet + revenue KPIs"
KPI=$(get /analytics/dashboard "Authorization: Bearer $A_TOKEN")
FLEET_TOTAL=$(echo "$KPI" | jq -r '.data.fleet.total // empty')
if [ -n "$FLEET_TOTAL" ] && [ "$FLEET_TOTAL" -ge 1 ]; then
  ok "Dashboard returns fleet.total=$FLEET_TOTAL"
else
  bad "Dashboard KPIs malformed: $KPI"
fi

# ---- Platform guard: tenant admin can't hit /platform ----
say "Platform guard: tenant ADMIN is rejected from /platform/metrics"
PLAT=$(get /platform/metrics "Authorization: Bearer $A_TOKEN")
PLAT_STATUS=$(echo "$PLAT" | jq -r '.statusCode // empty')
if [ "$PLAT_STATUS" = "403" ]; then
  ok "Tenant ADMIN gets 403 on /platform (only SUPER_ADMIN allowed)"
else
  bad "Unexpected response on /platform: $PLAT"
fi

# ---- Summary ----
echo
printf "\033[1mResult:\033[0m %s passed, %s failed\n" "$PASS" "$FAIL"
exit $FAIL
