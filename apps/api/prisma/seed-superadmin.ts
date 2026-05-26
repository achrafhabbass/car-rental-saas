/* eslint-disable no-console */
/**
 * Creates (or resets) a known platform-owner account.
 *
 * SUPER_ADMIN users have `tenantId = null` so they bypass every tenant
 * guard and can manage every agency, subscription and audit entry.
 *
 * Run: pnpm --filter @autosphere/api exec ts-node prisma/seed-superadmin.ts
 */
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const EMAIL = 'owner@autosphere.ma';
const PASSWORD = 'Owner123!';

async function main() {
  const prisma = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash(PASSWORD, 12);

    const existing = await prisma.user.findFirst({ where: { email: EMAIL } });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          role: UserRole.SUPER_ADMIN,
          tenantId: null,
          status: UserStatus.ACTIVE,
          mustChangePassword: false,
        },
      });
      console.log(`✓ Reset existing user ${EMAIL} to SUPER_ADMIN`);
    } else {
      await prisma.user.create({
        data: {
          email: EMAIL,
          passwordHash,
          firstName: 'Platform',
          lastName: 'Owner',
          role: UserRole.SUPER_ADMIN,
          status: UserStatus.ACTIVE,
          tenantId: null,
        },
      });
      console.log(`✓ Created SUPER_ADMIN ${EMAIL}`);
    }

    console.log(`\nLogin at http://localhost:3000/login`);
    console.log(`  Email:    ${EMAIL}`);
    console.log(`  Password: ${PASSWORD}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
