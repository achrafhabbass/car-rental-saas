# ============================================
# AutoSphere API - Multi-stage Dockerfile
# ============================================

# ---- Base ----
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile || pnpm install

# ---- Build ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules/ ./apps/api/node_modules/
COPY --from=deps /app/packages/shared/node_modules/ ./packages/shared/node_modules/
COPY . .
WORKDIR /app/apps/api
RUN pnpm prisma generate
RUN pnpm run build

# ---- Production ----
FROM node:20-alpine AS production
RUN apk add --no-cache openssl libc6-compat postgresql-client
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma
COPY --from=build /app/apps/api/package.json ./package.json
COPY --from=build /app/packages/shared ./packages/shared

EXPOSE 4001

# Migrate on startup, then run
CMD npx prisma migrate deploy --schema ./prisma/schema.prisma && node dist/main.js
