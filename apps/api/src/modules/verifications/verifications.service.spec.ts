import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { VerificationsService } from './verifications.service';

/**
 * Isolated unit coverage of verification decisions — self-approval
 * prevention, reviewer-assignment claiming, and the decision->status
 * mapping (blueprint Phase 13 §19.1 "Verification decisions"). Uses a
 * mocked PrismaService/StorageService/NotificationsService; the DB-backed
 * version lives in test/verifications.e2e-spec.ts.
 */
describe('VerificationsService', () => {
  let prisma: {
    verificationRequest: { findUnique: jest.Mock; update: jest.Mock };
  };
  let storage: Record<string, jest.Mock>;
  let notifications: { create: jest.Mock };
  let service: VerificationsService;

  const request = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 'req-1',
    type: 'UNIVERSITY_AFFILIATION',
    status: 'IN_REVIEW',
    decisionReason: null,
    submittedAt: new Date(),
    reviewedAt: null,
    expiresAt: null,
    assignedVerifierId: null,
    tutorProfile: { id: 'profile-1', userId: 'tutor-1', fullName: 'Tutor One' },
    evidence: [],
    ...overrides,
  });

  beforeEach(() => {
    prisma = {
      verificationRequest: { findUnique: jest.fn(), update: jest.fn() },
    };
    storage = {};
    notifications = { create: jest.fn().mockResolvedValue(undefined) };
    service = new VerificationsService(prisma as any, storage as any, notifications as any);
  });

  describe('decide (authorization and state transition)', () => {
    it('prevents a reviewer from approving their own verification request', async () => {
      prisma.verificationRequest.findUnique.mockResolvedValue(
        request({ tutorProfile: { id: 'profile-1', userId: 'reviewer-1', fullName: 'Self' } }),
      );

      await expect(
        service.decide('reviewer-1', ['VERIFIER'], 'req-1', { decision: 'APPROVE' } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.verificationRequest.update).not.toHaveBeenCalled();
    });

    it('rejects deciding a request that is not IN_REVIEW', async () => {
      prisma.verificationRequest.findUnique.mockResolvedValue(request({ status: 'PENDING' }));

      await expect(
        service.decide('reviewer-1', ['VERIFIER'], 'req-1', { decision: 'APPROVE' } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('lets another VERIFIER claim an unassigned request', async () => {
      prisma.verificationRequest.findUnique.mockResolvedValue(request({ assignedVerifierId: null }));
      prisma.verificationRequest.update.mockResolvedValue(request({ status: 'APPROVED' }));

      await expect(
        service.decide('reviewer-1', ['VERIFIER'], 'req-1', { decision: 'APPROVE' } as any),
      ).resolves.toBeDefined();
    });

    it('blocks a VERIFIER from taking over a case already claimed by a different reviewer', async () => {
      prisma.verificationRequest.findUnique.mockResolvedValue(request({ assignedVerifierId: 'other-reviewer' }));

      await expect(
        service.decide('reviewer-1', ['VERIFIER'], 'req-1', { decision: 'APPROVE' } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lets ADMIN override another reviewer’s claimed case', async () => {
      prisma.verificationRequest.findUnique.mockResolvedValue(request({ assignedVerifierId: 'other-reviewer' }));
      prisma.verificationRequest.update.mockResolvedValue(request({ status: 'APPROVED' }));

      await expect(
        service.decide('admin-1', ['ADMIN'], 'req-1', { decision: 'APPROVE' } as any),
      ).resolves.toBeDefined();
    });

    it.each(['REJECT', 'REQUEST_MORE_INFO'])('requires a reason to %s', async (decision) => {
      prisma.verificationRequest.findUnique.mockResolvedValue(request());

      await expect(
        service.decide('reviewer-1', ['VERIFIER'], 'req-1', { decision } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it.each`
      decision       | targetStatus
      ${'APPROVE'}   | ${'APPROVED'}
      ${'REJECT'}    | ${'REJECTED'}
      ${'REQUEST_MORE_INFO'} | ${'NEEDS_INFORMATION'}
    `('maps decision $decision to status $targetStatus', async ({ decision, targetStatus }) => {
      prisma.verificationRequest.findUnique.mockResolvedValue(request());
      prisma.verificationRequest.update.mockResolvedValue(request({ status: targetStatus }));

      await service.decide('reviewer-1', ['VERIFIER'], 'req-1', { decision, reason: 'because' } as any);

      expect(prisma.verificationRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: targetStatus }) }),
      );
    });

    it('notifies the tutor of the decision', async () => {
      prisma.verificationRequest.findUnique.mockResolvedValue(request());
      prisma.verificationRequest.update.mockResolvedValue(request({ status: 'APPROVED' }));

      await service.decide('reviewer-1', ['VERIFIER'], 'req-1', { decision: 'APPROVE' } as any);

      expect(notifications.create).toHaveBeenCalledWith(
        'tutor-1',
        'VERIFICATION_UPDATED',
        expect.objectContaining({ status: 'APPROVED' }),
      );
    });
  });

  describe('assertCanView (via getDetail) — role checks', () => {
    it('allows the owning tutor to view their own request', async () => {
      prisma.verificationRequest.findUnique.mockResolvedValue(request());

      await expect(service.getDetail('tutor-1', [], 'req-1')).resolves.toBeDefined();
    });

    it.each([['VERIFIER'], ['ADMIN']])('allows a %s to view any request', async (role) => {
      prisma.verificationRequest.findUnique.mockResolvedValue(request());

      await expect(service.getDetail('reviewer-1', [role] as any, 'req-1')).resolves.toBeDefined();
    });

    it('hides the request from an unrelated user (404, not 403, to avoid leaking existence)', async () => {
      prisma.verificationRequest.findUnique.mockResolvedValue(request());

      await expect(service.getDetail('stranger-1', ['TUTOR'], 'req-1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
