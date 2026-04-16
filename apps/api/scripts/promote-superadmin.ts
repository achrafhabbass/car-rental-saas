/* eslint-disable no-console */
/**
 * Promotes an existing user (by email) to SUPER_ADMIN and detaches them from
 * their tenant so they operate cross-tenant.
 *
 * Usage:
 *   pnpm --filter @autosphere/api run promote-superadmin -- user@example.com
 */
import { PrismaClient } from '@prisma/client';

async function main(): Promise<void> {
  const rawEmail = process.argv[2];
  if (!rawEmail) {
    console.error('Usage: promote-superadmin <email>');
    process.exit(1);
  }
  const email = rawEmail.toLowerCase();

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      console.error(`No user found with email ${email}`);
      process.exit(1);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'SUPER_ADMIN', tenantId: null },
    });

    console.log(`Promoted ${updated.email} → SUPER_ADMIN (tenantId cleared)`);
    console.log('Note: the user must re-login for the new role to appear in their JWT.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
