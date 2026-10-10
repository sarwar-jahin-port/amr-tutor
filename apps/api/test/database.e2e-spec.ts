import { config } from 'dotenv';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

config({ path: path.resolve(__dirname, '../../../.env') });

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function uniqueEmail(label: string): string {
  return `${label}-${randomUUID()}@test.amr-tutor.invalid`;
}

async function createUser(label: string) {
  return prisma.user.create({ data: { email: uniqueEmail(label), passwordHash: 'x' } });
}

describe('Database constraints (Phase 2 schema)', () => {
  let university: { id: string };

  beforeAll(async () => {
    university = await prisma.university.upsert({
      where: { normalizedName: 'test university (phase 2 specs)' },
      update: {},
      create: {
        name: 'Test University (Phase 2 specs)',
        normalizedName: 'test university (phase 2 specs)',
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('enforces one tutor profile per user', async () => {
    const user = await createUser('one-tutor-profile');
    const tutorProfileData = {
      userId: user.id,
      universityId: university.id,
      fullName: 'Test Tutor',
      department: 'CSE',
      degreeProgram: 'BSc',
      academicStatus: 'CURRENT_STUDENT' as const,
    };

    try {
      await prisma.tutorProfile.create({ data: tutorProfileData });
      await expect(prisma.tutorProfile.create({ data: tutorProfileData })).rejects.toMatchObject({
        code: 'P2002',
      });
    } finally {
      await prisma.tutorProfile.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  it('enforces one guardian profile per user', async () => {
    const user = await createUser('one-guardian-profile');
    const guardianProfileData = { userId: user.id, displayName: 'Test Guardian' };

    try {
      await prisma.guardianProfile.create({ data: guardianProfileData });
      await expect(
        prisma.guardianProfile.create({ data: guardianProfileData }),
      ).rejects.toMatchObject({ code: 'P2002' });
    } finally {
      await prisma.guardianProfile.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  it('enforces no duplicate role assignment for the same user', async () => {
    const user = await createUser('no-duplicate-role');

    try {
      await prisma.userRole.create({ data: { userId: user.id, role: 'TUTOR' } });
      await expect(
        prisma.userRole.create({ data: { userId: user.id, role: 'TUTOR' } }),
      ).rejects.toMatchObject({ code: 'P2002' });
    } finally {
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  it('enforces no duplicate application from the same tutor to the same listing', async () => {
    const guardian = await createUser('listing-owner');
    const tutorUser = await createUser('duplicate-applicant');

    const listing = await prisma.tuitionListing.create({
      data: {
        guardianUserId: guardian.id,
        title: 'Need a Physics tutor',
        classLevel: 'CLASS_9',
        city: 'Dhaka',
        area: 'Dhanmondi',
        daysPerWeek: 3,
      },
    });

    const tutorProfile = await prisma.tutorProfile.create({
      data: {
        userId: tutorUser.id,
        universityId: university.id,
        fullName: 'Duplicate Applicant',
        department: 'Physics',
        degreeProgram: 'BSc',
        academicStatus: 'CURRENT_STUDENT',
      },
    });

    try {
      await prisma.application.create({
        data: { listingId: listing.id, tutorProfileId: tutorProfile.id },
      });
      await expect(
        prisma.application.create({
          data: { listingId: listing.id, tutorProfileId: tutorProfile.id },
        }),
      ).rejects.toMatchObject({ code: 'P2002' });
    } finally {
      await prisma.application.deleteMany({ where: { listingId: listing.id } });
      await prisma.tutorProfile.delete({ where: { id: tutorProfile.id } });
      await prisma.tuitionListing.delete({ where: { id: listing.id } });
      await prisma.user.deleteMany({ where: { id: { in: [guardian.id, tutorUser.id] } } });
    }
  });

  it('restricts deleting a user who still owns a tuition listing', async () => {
    const guardian = await createUser('restrict-delete-owner');

    const listing = await prisma.tuitionListing.create({
      data: {
        guardianUserId: guardian.id,
        title: 'Need a Math tutor',
        classLevel: 'CLASS_8',
        city: 'Chattogram',
        area: 'Agrabad',
        daysPerWeek: 2,
      },
    });

    try {
      await expect(prisma.user.delete({ where: { id: guardian.id } })).rejects.toMatchObject({
        code: 'P2003',
      });
    } finally {
      await prisma.tuitionListing.delete({ where: { id: listing.id } });
      await prisma.user.delete({ where: { id: guardian.id } });
    }
  });

  it('cascades deleting a user to their tutor profile and role assignments', async () => {
    const user = await createUser('cascade-delete');

    await prisma.userRole.create({ data: { userId: user.id, role: 'TUTOR' } });
    const tutorProfile = await prisma.tutorProfile.create({
      data: {
        userId: user.id,
        universityId: university.id,
        fullName: 'Cascade Tutor',
        department: 'Chemistry',
        degreeProgram: 'BSc',
        academicStatus: 'CURRENT_STUDENT',
      },
    });

    await prisma.user.delete({ where: { id: user.id } });

    const [remainingProfile, remainingRole] = await Promise.all([
      prisma.tutorProfile.findUnique({ where: { id: tutorProfile.id } }),
      prisma.userRole.findUnique({ where: { userId_role: { userId: user.id, role: 'TUTOR' } } }),
    ]);

    expect(remainingProfile).toBeNull();
    expect(remainingRole).toBeNull();
  });

  it('nulls out the assigned verifier when that verifier user is deleted', async () => {
    const tutorUser = await createUser('verification-subject');
    const verifierUser = await createUser('verifier-to-delete');

    const tutorProfile = await prisma.tutorProfile.create({
      data: {
        userId: tutorUser.id,
        universityId: university.id,
        fullName: 'Verification Subject',
        department: 'Biology',
        degreeProgram: 'BSc',
        academicStatus: 'CURRENT_STUDENT',
      },
    });

    const verificationRequest = await prisma.verificationRequest.create({
      data: {
        tutorProfileId: tutorProfile.id,
        type: 'UNIVERSITY_AFFILIATION',
        assignedVerifierId: verifierUser.id,
      },
    });

    try {
      await prisma.user.delete({ where: { id: verifierUser.id } });

      const updated = await prisma.verificationRequest.findUniqueOrThrow({
        where: { id: verificationRequest.id },
      });
      expect(updated.assignedVerifierId).toBeNull();
    } finally {
      await prisma.verificationRequest.delete({ where: { id: verificationRequest.id } });
      await prisma.tutorProfile.delete({ where: { id: tutorProfile.id } });
      await prisma.user.delete({ where: { id: tutorUser.id } });
    }
  });
});
