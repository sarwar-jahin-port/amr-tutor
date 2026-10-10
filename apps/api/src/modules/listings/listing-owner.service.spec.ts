import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ListingOwnerService } from './listing-owner.service';

/**
 * Isolated unit coverage of listing state transitions, rate-range
 * validation, and ownership checks (blueprint Phase 13 §19.1). Uses a
 * mocked PrismaService — the DB-backed version of these rules lives in
 * test/guardian-listings.e2e-spec.ts.
 */
describe('ListingOwnerService', () => {
  let prisma: {
    tuitionListing: { findFirst: jest.Mock; update: jest.Mock };
    application: { updateMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let service: ListingOwnerService;

  const listing = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 'listing-1',
    guardianUserId: 'guardian-1',
    title: 'Math tutor needed',
    description: null,
    classLevel: 'CLASS_8',
    city: 'Dhaka',
    area: 'Mirpur',
    neighborhood: null,
    locationDescription: null,
    salaryMin: 5000,
    salaryMax: 8000,
    currency: 'BDT',
    daysPerWeek: 3,
    preferredGender: null,
    teachingMode: 'HOME',
    startDate: null,
    publishedAt: null,
    status: 'DRAFT',
    curriculum: null,
    subjects: [{ subject: { id: 'subj-1', name: 'Math' } }],
    universityPreferences: [],
    schedules: [],
    ...overrides,
  });

  beforeEach(() => {
    prisma = {
      tuitionListing: { findFirst: jest.fn(), update: jest.fn() },
      application: { updateMany: jest.fn() },
      $transaction: jest.fn(async (fn: any) => fn(prisma)),
    };
    service = new ListingOwnerService(prisma as any);
  });

  describe('rate-range validation (salaryMin/salaryMax)', () => {
    it('rejects an update where salaryMin exceeds salaryMax', async () => {
      prisma.tuitionListing.findFirst.mockResolvedValue(listing({ salaryMin: 1000, salaryMax: 2000 }));

      await expect(
        service.update('guardian-1', 'listing-1', { salaryMin: 5000, salaryMax: 2000 } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('allows salaryMin equal to salaryMax', async () => {
      prisma.tuitionListing.findFirst.mockResolvedValue(listing());
      prisma.tuitionListing.update.mockResolvedValue(listing({ salaryMin: 5000, salaryMax: 5000 }));

      await expect(
        service.update('guardian-1', 'listing-1', { salaryMin: 5000, salaryMax: 5000 } as any),
      ).resolves.toBeDefined();
    });

    it('falls back to the existing stored value for whichever bound is omitted from the patch', async () => {
      // existing salaryMax is 8000; patching salaryMin above it must still be caught.
      prisma.tuitionListing.findFirst.mockResolvedValue(listing({ salaryMin: 1000, salaryMax: 8000 }));

      await expect(
        service.update('guardian-1', 'listing-1', { salaryMin: 9000 } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('submit (DRAFT/REJECTED -> PENDING_REVIEW)', () => {
    it.each(['DRAFT', 'REJECTED'])('allows submitting from %s', async (status) => {
      prisma.tuitionListing.findFirst.mockResolvedValue(listing({ status }));
      prisma.tuitionListing.update.mockResolvedValue(listing({ status: 'PENDING_REVIEW' }));

      await expect(service.submit('guardian-1', 'listing-1')).resolves.toBeDefined();
    });

    it.each(['PENDING_REVIEW', 'PUBLISHED', 'PAUSED', 'CLOSED', 'FILLED', 'EXPIRED'])(
      'rejects submitting from %s',
      async (status) => {
        prisma.tuitionListing.findFirst.mockResolvedValue(listing({ status }));

        await expect(service.submit('guardian-1', 'listing-1')).rejects.toBeInstanceOf(BadRequestException);
        expect(prisma.tuitionListing.update).not.toHaveBeenCalled();
      },
    );

    it('rejects submitting with no subjects attached (required-fields check)', async () => {
      prisma.tuitionListing.findFirst.mockResolvedValue(listing({ status: 'DRAFT', subjects: [] }));

      await expect(service.submit('guardian-1', 'listing-1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a caller who does not own the listing (ownership check)', async () => {
      prisma.tuitionListing.findFirst.mockResolvedValue(null);

      await expect(service.submit('someone-else', 'listing-1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('close (idempotent terminal transition)', () => {
    it('is a no-op when the listing is already CLOSED', async () => {
      prisma.tuitionListing.findFirst.mockResolvedValue(listing({ status: 'CLOSED' }));

      await service.close('guardian-1', 'listing-1');

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('bulk-closes outstanding applications when a published listing closes', async () => {
      prisma.tuitionListing.findFirst.mockResolvedValue(listing({ status: 'PUBLISHED' }));
      prisma.tuitionListing.update.mockResolvedValue(listing({ status: 'CLOSED' }));

      await service.close('guardian-1', 'listing-1');

      expect(prisma.application.updateMany).toHaveBeenCalledWith({
        where: { listingId: 'listing-1', status: { in: ['SUBMITTED', 'VIEWED', 'SHORTLISTED', 'CONTACT_REQUESTED'] } },
        data: { status: 'CLOSED' },
      });
    });
  });

  describe('schedule slot validation (toScheduleRow)', () => {
    const callToScheduleRow = (slot: { day: string; startTime?: string; endTime?: string }) =>
      (service as any).toScheduleRow(slot);

    it('rejects a slot with only a startTime and no endTime', () => {
      expect(() => callToScheduleRow({ day: 'MONDAY', startTime: '10:00' })).toThrow(BadRequestException);
    });

    it('rejects a slot where startTime is not before endTime', () => {
      expect(() => callToScheduleRow({ day: 'MONDAY', startTime: '15:00', endTime: '10:00' })).toThrow(
        BadRequestException,
      );
    });

    it('accepts a valid ordered slot', () => {
      const row = callToScheduleRow({ day: 'MONDAY', startTime: '10:00', endTime: '12:30' });
      expect(row).toEqual({ day: 'MONDAY', startMinute: 600, endMinute: 750 });
    });

    it('accepts a slot with neither time (day-only availability)', () => {
      const row = callToScheduleRow({ day: 'MONDAY' });
      expect(row).toEqual({ day: 'MONDAY', startMinute: null, endMinute: null });
    });
  });
});
