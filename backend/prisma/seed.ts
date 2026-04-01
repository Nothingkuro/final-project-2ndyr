import 'dotenv/config';
import { Role } from '@prisma/client';
import prisma from '../src/lib/prisma';
import { hashPassword } from '../src/utils/auth';

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function main() {
  const ownerUsername = process.env.SEED_OWNER_USERNAME ?? 'owner';
  const staffUsername = process.env.SEED_STAFF_USERNAME ?? 'staff';
  const ownerPassword = requiredEnv('SEED_OWNER_PASSWORD');
  const staffPassword = requiredEnv('SEED_STAFF_PASSWORD');
  const ownerPasswordHash = await hashPassword(ownerPassword);
  const staffPasswordHash = await hashPassword(staffPassword);

  // Seed accounts from environment variables to avoid committing credentials.
  const users = [
    {
      username: ownerUsername,
      passwordHash: ownerPasswordHash,
      role: Role.ADMIN,
    },
    {
      username: staffUsername,
      passwordHash: staffPasswordHash,
      role: Role.STAFF,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        passwordHash: user.passwordHash,
        role: user.role,
      },
      create: user,
    });
  }

  console.log('Seed complete. Login accounts created/updated:');
  console.log(`- Owner role: username="${ownerUsername}"`);
  console.log(`- Staff role: username="${staffUsername}"`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
