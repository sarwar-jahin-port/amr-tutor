import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// Playwright runs these tests with `apps/web` as the process cwd, but
// DATABASE_URL lives in the repo-root .env (see prisma/seed.ts, which the
// same variable is read by). Don't override an already-exported env var —
// CI exports DATABASE_URL itself rather than relying on a checked-in file.
loadEnv({ path: path.resolve(__dirname, '../../../../.env') });

export type PrivilegedRole = 'ADMIN' | 'VERIFIER' | 'MODERATOR';

// Playwright can reuse one worker process across several spec files, and
// each of those files calls disconnectDb() in its own teardown. Lazily
// (re)creating the client means a later file's grantRole() still works
// even after an earlier file in the same worker process already
// disconnected — rather than every file having to coordinate a single
// shared teardown.
let client: PrismaClient | null = null;

function getClient(): PrismaClient {
  if (!client) {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    client = new PrismaClient({ adapter });
  }
  return client;
}

/**
 * Bootstraps a privileged role directly in the database — the one
 * deliberate exception to "drive everything through the UI" in these
 * end-to-end tests.
 *
 * Per docs/decisions/0001-phase-0-mvp-scope.md, ADMIN/VERIFIER/MODERATOR
 * can never be self-assigned through the product: registration and the
 * role-self-service endpoint both restrict new roles to TUTOR/GUARDIAN.
 * There is no UI path that grants these roles, so a test that needs a
 * reviewer/admin account has no choice but to create the UserRole row
 * itself. Call this only to bootstrap that one role grant; every other
 * step (logging in as the now-privileged account, approving a listing,
 * deciding a verification, ...) must go through the real browser UI.
 */
export async function grantRole(email: string, role: PrivilegedRole): Promise<void> {
  const prisma = getClient();
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  await prisma.userRole.upsert({
    where: { userId_role: { userId: user.id, role } },
    create: { userId: user.id, role },
    update: {},
  });
}

/** Call from a test's `afterAll`/teardown so Playwright's process can exit cleanly. */
export async function disconnectDb(): Promise<void> {
  if (!client) return;
  const current = client;
  client = null;
  await current.$disconnect();
}
