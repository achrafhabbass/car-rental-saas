# AutoSphere SaaS

> Plateforme SaaS multi-tenant de gestion de location de voitures.

## Monorepo

```
autosphere-saas/
├── apps/
│   ├── api/          # NestJS backend (REST API)
│   └── web/          # Next.js 14 frontend (App Router)
├── packages/
│   └── shared/       # Shared TypeScript types & constants
├── docker-compose.yml
└── .env.example
```

## Tech stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: NestJS 10, TypeScript, Prisma 5, PostgreSQL 16
- **Auth**: JWT (access 15m + refresh 7d, rotation + revocation)
- **Multi-tenancy**: shared DB, `tenantId` filtering; middleware-based tenant resolution
- **Infra**: Docker Compose (local dev), production-ready Dockerfiles

## Getting started

### Prerequisites

- Node.js >= 20
- pnpm >= 8
- Docker + Docker Compose (for PostgreSQL)

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env template
cp .env.example .env
# Ensure JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are >= 32 chars

# 3. Start PostgreSQL
docker compose up -d postgres

# 4. Generate Prisma client + run migrations
pnpm --filter @autosphere/api prisma:generate
pnpm --filter @autosphere/api prisma:migrate --name init

# 5. Start all services (API + web)
pnpm dev
```

- API: http://localhost:4000/api/v1
- Web: http://localhost:3000
- Health: http://localhost:4000/api/v1/health

### Full-stack via Docker Compose

```bash
docker compose up
```

## Scripts

| Script             | Description                              |
| ------------------ | ---------------------------------------- |
| `pnpm dev`         | Run API + web in parallel                |
| `pnpm build`       | Build all workspaces                     |
| `pnpm docker:up`   | Start all services in Docker             |
| `pnpm db:migrate`  | Run Prisma migrations                    |
| `pnpm db:studio`   | Launch Prisma Studio                     |

## Multi-tenant architecture

- **Strategy**: shared database + tenant-scoped rows (all tenant models carry `tenantId`).
- **Resolution order** in `TenantMiddleware`:
  1. JWT claim (`tenantId`) — default
  2. `x-tenant-id` header — for admin tooling
  3. Subdomain (e.g. `acme.autosphere.app`)
- **Enforcement**: `TenantGuard` rejects cross-tenant access; `SUPER_ADMIN` bypasses.

## Auth flow

1. `POST /auth/register` — creates tenant + owner user (14-day trial).
2. `POST /auth/login` — returns access + refresh tokens.
3. `POST /auth/refresh` — rotates refresh token (one-time-use).
4. `POST /auth/logout` — revokes all refresh tokens for user.

## Next phases

See the project specification (cahier des charges) for the full roadmap.
Phase 0 (Fondations) is scaffolded here; Phase 1 (Véhicules / Clients / Réservations / Contrats) is next.

---

AutoSphere SaaS · Confidential · v0.1.0
