import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/**
 * No reference data exists yet — the schema has no models until Phase 2.
 * This script exists now so `db:seed` is a working, idempotent command
 * from the start, per blueprint Phase 1 "required scripts".
 */
async function main(): Promise<void> {
  console.log('No seed data to apply yet (Phase 2 introduces the schema).');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
