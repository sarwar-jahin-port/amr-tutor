import { BadRequestException } from '@nestjs/common';
import { ContactShareService } from './contact-share.service';

/**
 * Isolated unit coverage of contact-sharing authorization and the mutual-
 * consent reveal rule (blueprint Phase 13 §19.1 "Contact-sharing
 * authorization"; decision record 0001 item 8: a field is only ever
 * revealed once BOTH parties have independently consented, never inferred
 * from one side alone). Uses mocked collaborators; the DB-backed version
 * lives in test/messaging.e2e-spec.ts.
 */
describe('ContactShareService', () => {
  let prisma: {
    contactShare: { create: jest.Mock; findFirst: jest.Mock };
    user: { findUniqueOrThrow: jest.Mock };
  };
  let applications: { assertParticipant: jest.Mock; markContactRequested: jest.Mock };
  let notifications: { create: jest.Mock };
  let service: ContactShareService;

  const participant = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 'app-1',
    status: 'SHORTLISTED',
    listingId: 'listing-1',
    tutorUserId: 'tutor-1',
    guardianUserId: 'guardian-1',
    ...overrides,
  });

  beforeEach(() => {
    prisma = {
      contactShare: { create: jest.fn().mockResolvedValue(undefined), findFirst: jest.fn() },
      user: { findUniqueOrThrow: jest.fn() },
    };
    applications = {
      assertParticipant: jest.fn().mockResolvedValue(participant()),
      markContactRequested: jest.fn().mockResolvedValue(undefined),
    };
    notifications = { create: jest.fn().mockResolvedValue(undefined) };
    service = new ContactShareService(prisma as any, applications as any, notifications as any);
  });

  describe('share (eligibility)', () => {
    it.each(['SHORTLISTED', 'CONTACT_REQUESTED', 'ACCEPTED'])('allows sharing once %s', async (status) => {
      applications.assertParticipant.mockResolvedValue(participant({ status }));
      prisma.contactShare.findFirst.mockResolvedValue(null);

      await expect(
        service.share('tutor-1', 'app-1', { sharePhone: true, shareEmail: false } as any),
      ).resolves.toBeDefined();
    });

    it.each(['SUBMITTED', 'VIEWED', 'DECLINED', 'WITHDRAWN', 'CLOSED'])(
      'rejects sharing while the application is %s',
      async (status) => {
        applications.assertParticipant.mockResolvedValue(participant({ status }));

        await expect(
          service.share('tutor-1', 'app-1', { sharePhone: true, shareEmail: false } as any),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(prisma.contactShare.create).not.toHaveBeenCalled();
      },
    );

    it('notifies the counterpart, not the sharer', async () => {
      prisma.contactShare.findFirst.mockResolvedValue(null);

      await service.share('tutor-1', 'app-1', { sharePhone: true, shareEmail: false } as any);

      expect(notifications.create).toHaveBeenCalledWith('guardian-1', 'CONTACT_REQUESTED', { applicationId: 'app-1' });
    });
  });

  describe('getState (mutual-consent reveal)', () => {
    it('reveals nothing when only one side has consented', async () => {
      // caller (tutor) shared phone; counterpart (guardian) has not shared anything.
      prisma.contactShare.findFirst
        .mockResolvedValueOnce({ sharedFields: { phone: true, email: false }, consentedAt: new Date() })
        .mockResolvedValueOnce(null);

      const state = await service.getState('tutor-1', 'app-1');

      expect(state.contact).toEqual({ phone: null, email: null });
      expect(prisma.user.findUniqueOrThrow).not.toHaveBeenCalled();
    });

    it('reveals the field once both sides have consented to it', async () => {
      prisma.contactShare.findFirst
        .mockResolvedValueOnce({ sharedFields: { phone: true, email: false }, consentedAt: new Date() })
        .mockResolvedValueOnce({ sharedFields: { phone: true, email: false }, consentedAt: new Date() });
      prisma.user.findUniqueOrThrow.mockResolvedValue({ phone: '01700000000', email: 'guardian@example.com' });

      const state = await service.getState('tutor-1', 'app-1');

      expect(state.contact).toEqual({ phone: '01700000000', email: null });
    });

    it('keeps email withheld even when phone is mutually revealed, if email consent is one-sided', async () => {
      prisma.contactShare.findFirst
        .mockResolvedValueOnce({ sharedFields: { phone: true, email: true }, consentedAt: new Date() })
        .mockResolvedValueOnce({ sharedFields: { phone: true, email: false }, consentedAt: new Date() });
      prisma.user.findUniqueOrThrow.mockResolvedValue({ phone: '01700000000', email: 'guardian@example.com' });

      const state = await service.getState('tutor-1', 'app-1');

      expect(state.contact).toEqual({ phone: '01700000000', email: null });
    });
  });
});
