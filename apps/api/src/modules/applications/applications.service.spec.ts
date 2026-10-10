import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApplicationsService } from './applications.service';

/**
 * Isolated unit coverage of the application state machine, ownership
 * checks, and duplicate-application handling (blueprint Phase 13 §19.1):
 * everything here runs against a mocked PrismaService/NotificationsService
 * so the business rule — not the database — is what's under test. The
 * exhaustive, DB-backed version of these same rules lives in
 * test/applications.e2e-spec.ts.
 */
describe('ApplicationsService', () => {
  let prisma: {
    tutorProfile: { findUnique: jest.Mock };
    tuitionListing: { findFirst: jest.Mock };
    application: {
      create: jest.Mock;
      findUnique: jest.Mock;
      updateMany: jest.Mock;
      findUniqueOrThrow: jest.Mock;
    };
  };
  let notifications: { create: jest.Mock };
  let service: ApplicationsService;

  const application = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 'app-1',
    status: 'SUBMITTED',
    introduction: null,
    submittedAt: new Date(),
    updatedAt: new Date(),
    tutorProfile: {
      id: 'profile-1',
      userId: 'tutor-1',
      fullName: 'Tutor One',
      academicStatus: 'UNDERGRADUATE',
      university: { id: 'uni-1', name: 'Test University' },
      subjects: [],
      grades: [],
    },
    listing: {
      id: 'listing-1',
      title: 'Math tutor needed',
      classLevel: 'CLASS_8',
      city: 'Dhaka',
      area: 'Mirpur',
      status: 'PUBLISHED',
      guardianUserId: 'guardian-1',
    },
    ...overrides,
  });

  beforeEach(() => {
    prisma = {
      tutorProfile: { findUnique: jest.fn() },
      tuitionListing: { findFirst: jest.fn() },
      application: {
        create: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
    };
    notifications = { create: jest.fn().mockResolvedValue(undefined) };
    service = new ApplicationsService(prisma as any, notifications as any);
  });

  describe('apply (duplicate application handling)', () => {
    it('converts the unique-constraint violation into a 409, not a raw DB error', async () => {
      prisma.tutorProfile.findUnique.mockResolvedValue({ id: 'profile-1' });
      prisma.tuitionListing.findFirst.mockResolvedValue({ id: 'listing-1', guardianUserId: 'guardian-1' });
      prisma.application.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('duplicate', { code: 'P2002', clientVersion: 'x' }),
      );

      await expect(service.apply('tutor-1', 'listing-1', { introduction: 'hi' } as any)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(notifications.create).not.toHaveBeenCalled();
    });

    it('rejects applying without a tutor profile', async () => {
      prisma.tutorProfile.findUnique.mockResolvedValue(null);

      await expect(service.apply('tutor-1', 'listing-1', {} as any)).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.tuitionListing.findFirst).not.toHaveBeenCalled();
    });

    it('rejects applying to an unpublished (or nonexistent) listing', async () => {
      prisma.tutorProfile.findUnique.mockResolvedValue({ id: 'profile-1' });
      prisma.tuitionListing.findFirst.mockResolvedValue(null);

      await expect(service.apply('tutor-1', 'listing-1', {} as any)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects a guardian applying to their own listing', async () => {
      prisma.tutorProfile.findUnique.mockResolvedValue({ id: 'profile-1' });
      prisma.tuitionListing.findFirst.mockResolvedValue({ id: 'listing-1', guardianUserId: 'tutor-1' });

      await expect(service.apply('tutor-1', 'listing-1', {} as any)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('notifies the listing owner once a valid application is created', async () => {
      prisma.tutorProfile.findUnique.mockResolvedValue({ id: 'profile-1' });
      prisma.tuitionListing.findFirst.mockResolvedValue({ id: 'listing-1', guardianUserId: 'guardian-1' });
      prisma.application.create.mockResolvedValue(application());

      await service.apply('tutor-1', 'listing-1', {} as any);

      expect(notifications.create).toHaveBeenCalledWith(
        'guardian-1',
        'APPLICATION_RECEIVED',
        expect.objectContaining({ listingId: 'listing-1' }),
      );
    });
  });

  describe('updateStatus (owner-driven state transitions)', () => {
    it.each`
      from                   | to
      ${'SUBMITTED'}         | ${'VIEWED'}
      ${'SUBMITTED'}         | ${'SHORTLISTED'}
      ${'SUBMITTED'}         | ${'DECLINED'}
      ${'VIEWED'}            | ${'SHORTLISTED'}
      ${'VIEWED'}            | ${'DECLINED'}
      ${'SHORTLISTED'}       | ${'DECLINED'}
      ${'CONTACT_REQUESTED'} | ${'ACCEPTED'}
    `('allows $from -> $to', async ({ from, to }) => {
      prisma.application.findUnique.mockResolvedValue(application({ status: from }));
      prisma.application.updateMany.mockResolvedValue({ count: 1 });
      prisma.application.findUniqueOrThrow.mockResolvedValue(application({ status: to }));

      await expect(service.updateStatus('guardian-1', 'app-1', { status: to } as any)).resolves.toBeDefined();
      expect(prisma.application.updateMany).toHaveBeenCalledWith({
        where: { id: 'app-1', status: from },
        data: { status: to },
      });
    });

    it.each`
      from                   | to
      ${'SHORTLISTED'}       | ${'ACCEPTED'}
      ${'DECLINED'}          | ${'SHORTLISTED'}
      ${'ACCEPTED'}          | ${'DECLINED'}
      ${'SUBMITTED'}         | ${'ACCEPTED'}
      ${'CONTACT_REQUESTED'} | ${'DECLINED'}
    `('rejects $from -> $to', async ({ from, to }) => {
      prisma.application.findUnique.mockResolvedValue(application({ status: from }));

      await expect(service.updateStatus('guardian-1', 'app-1', { status: to } as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.application.updateMany).not.toHaveBeenCalled();
    });

    it('rejects a caller who does not own the listing (ownership check)', async () => {
      prisma.application.findUnique.mockResolvedValue(application({ listing: { id: 'l', guardianUserId: 'someone-else' } }));

      await expect(
        service.updateStatus('guardian-1', 'app-1', { status: 'VIEWED' } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('surfaces a lost race (concurrent status change) as a 409, not a silent overwrite', async () => {
      prisma.application.findUnique.mockResolvedValue(application({ status: 'SUBMITTED' }));
      prisma.application.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.updateStatus('guardian-1', 'app-1', { status: 'VIEWED' } as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('notifies the applicant on a successful transition', async () => {
      prisma.application.findUnique.mockResolvedValue(application({ status: 'SUBMITTED' }));
      prisma.application.updateMany.mockResolvedValue({ count: 1 });
      prisma.application.findUniqueOrThrow.mockResolvedValue(application({ status: 'VIEWED' }));

      await service.updateStatus('guardian-1', 'app-1', { status: 'VIEWED' } as any);

      expect(notifications.create).toHaveBeenCalledWith(
        'tutor-1',
        'APPLICATION_UPDATED',
        expect.objectContaining({ status: 'VIEWED' }),
      );
    });
  });

  describe('withdraw (applicant-driven, role check)', () => {
    it.each(['SUBMITTED', 'VIEWED', 'SHORTLISTED', 'CONTACT_REQUESTED'])(
      'allows withdrawing from %s',
      async (status) => {
        prisma.application.findUnique.mockResolvedValue(application({ status }));
        prisma.application.updateMany.mockResolvedValue({ count: 1 });
        prisma.application.findUniqueOrThrow.mockResolvedValue(application({ status: 'WITHDRAWN' }));

        await expect(service.withdraw('tutor-1', 'app-1')).resolves.toBeDefined();
      },
    );

    it.each(['ACCEPTED', 'DECLINED', 'WITHDRAWN', 'CLOSED'])('rejects withdrawing from %s', async (status) => {
      prisma.application.findUnique.mockResolvedValue(application({ status }));

      await expect(service.withdraw('tutor-1', 'app-1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a caller who is not the applicant (role/ownership check)', async () => {
      prisma.application.findUnique.mockResolvedValue(
        application({ tutorProfile: { userId: 'someone-else' } }),
      );

      await expect(service.withdraw('tutor-1', 'app-1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
