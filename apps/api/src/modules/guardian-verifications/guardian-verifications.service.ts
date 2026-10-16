import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Role, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DecideGuardianVerificationDto } from './dto/decide-guardian-verification.dto';
import {
  GUARDIAN_VERIFICATION_INCLUDE,
  GuardianVerificationRequestDetailDto,
  toGuardianVerificationRequestDetailDto,
} from './dto/guardian-verification.dto';
import {
  MAX_EVIDENCE_FILE_SIZE_BYTES,
  RequestGuardianEvidenceUploadDto,
} from './dto/request-guardian-evidence-upload.dto';

/** The leading bytes of each allowed content type — checked against the stored object itself, not the client's claim. */
const MAGIC_BYTES: Record<string, { offset: number; bytes: number[] }[]> = {
  'image/jpeg': [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  'image/png': [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  'image/webp': [
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
    { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
  ],
  'application/pdf': [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] }],
};

const NON_TERMINAL_STATUSES: VerificationStatus[] = ['PENDING', 'IN_REVIEW', 'NEEDS_INFORMATION'];
const EVIDENCE_UPLOAD_STATUSES: VerificationStatus[] = ['PENDING', 'NEEDS_INFORMATION'];
const SUBMITTABLE_STATUSES: VerificationStatus[] = ['PENDING', 'NEEDS_INFORMATION'];
const REVIEWER_ROLES: Role[] = ['VERIFIER', 'ADMIN'];

type GuardianVerificationRow = Awaited<ReturnType<GuardianVerificationsService['findOrThrow']>>;

@Injectable()
export class GuardianVerificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(userId: string): Promise<GuardianVerificationRequestDetailDto> {
    const guardianProfile = await this.prisma.guardianProfile.findUnique({ where: { userId } });
    if (!guardianProfile) {
      throw new BadRequestException('Create your guardian profile before requesting verification.');
    }

    const existing = await this.prisma.guardianVerificationRequest.findFirst({
      where: { guardianUserId: userId, status: { in: NON_TERMINAL_STATUSES } },
    });
    if (existing) {
      throw new ConflictException('You already have an active verification request.');
    }

    const request = await this.prisma.guardianVerificationRequest.create({
      data: { guardianUserId: userId },
      include: GUARDIAN_VERIFICATION_INCLUDE,
    });

    return toGuardianVerificationRequestDetailDto(request);
  }

  async listOwn(userId: string): Promise<GuardianVerificationRequestDetailDto[]> {
    const rows = await this.prisma.guardianVerificationRequest.findMany({
      where: { guardianUserId: userId },
      include: GUARDIAN_VERIFICATION_INCLUDE,
      orderBy: { submittedAt: 'desc' },
    });
    return rows.map(toGuardianVerificationRequestDetailDto);
  }

  async getDetail(userId: string, userRoles: Role[], requestId: string): Promise<GuardianVerificationRequestDetailDto> {
    const request = await this.findOrThrow(requestId);
    this.assertCanView(userId, userRoles, request);
    return toGuardianVerificationRequestDetailDto(request);
  }

  async requestEvidenceUpload(
    userId: string,
    requestId: string,
    dto: RequestGuardianEvidenceUploadDto,
  ): Promise<{ evidenceId: string; uploadUrl: string }> {
    const request = await this.findOwnedOrThrow(userId, requestId);

    if (!EVIDENCE_UPLOAD_STATUSES.includes(request.status)) {
      throw new BadRequestException(`Evidence cannot be added while this request is ${request.status}.`);
    }

    const key = this.storage.generateObjectKey(`guardian-verification/${requestId}`, dto.originalFileName);

    const evidence = await this.prisma.guardianVerificationEvidence.create({
      data: {
        requestId,
        type: dto.evidenceType,
        storageKey: key,
        originalFileName: dto.originalFileName,
        mimeType: dto.contentType,
        sizeBytes: dto.fileSizeBytes,
      },
    });

    const uploadUrl = await this.storage.generateUploadUrl(key, dto.contentType);

    return { evidenceId: evidence.id, uploadUrl };
  }

  async submit(userId: string, requestId: string): Promise<GuardianVerificationRequestDetailDto> {
    const request = await this.findOwnedOrThrow(userId, requestId);

    if (!SUBMITTABLE_STATUSES.includes(request.status)) {
      throw new BadRequestException(`A request in ${request.status} status cannot be submitted.`);
    }
    if (request.evidence.length === 0) {
      throw new BadRequestException('Attach at least one piece of evidence before submitting.');
    }

    for (const item of request.evidence) {
      await this.assertEvidenceUploadedAndValid(item);
    }

    const updated = await this.prisma.guardianVerificationRequest.update({
      where: { id: requestId },
      data: { status: 'IN_REVIEW' },
      include: GUARDIAN_VERIFICATION_INCLUDE,
    });

    return toGuardianVerificationRequestDetailDto(updated);
  }

  async getEvidenceDownloadUrl(userId: string, userRoles: Role[], requestId: string, evidenceId: string): Promise<string> {
    const request = await this.findOrThrow(requestId);
    this.assertCanView(userId, userRoles, request);

    const evidence = request.evidence.find((e) => e.id === evidenceId);
    if (!evidence) {
      throw new NotFoundException('Evidence not found.');
    }

    return this.storage.generateDownloadUrl(evidence.storageKey);
  }

  async listQueue(userId: string, userRoles: Role[], status: VerificationStatus): Promise<GuardianVerificationRequestDetailDto[]> {
    const isAdmin = userRoles.includes('ADMIN');

    const rows = await this.prisma.guardianVerificationRequest.findMany({
      where: {
        status,
        ...(isAdmin ? {} : { OR: [{ assignedVerifierId: null }, { assignedVerifierId: userId }] }),
      },
      include: GUARDIAN_VERIFICATION_INCLUDE,
      orderBy: { submittedAt: 'asc' },
    });

    return rows.map(toGuardianVerificationRequestDetailDto);
  }

  async decide(
    reviewerId: string,
    reviewerRoles: Role[],
    requestId: string,
    dto: DecideGuardianVerificationDto,
  ): Promise<GuardianVerificationRequestDetailDto> {
    const request = await this.findOrThrow(requestId);

    if (request.guardianUserId === reviewerId) {
      throw new ForbiddenException('You cannot review your own verification request.');
    }
    if (request.status !== 'IN_REVIEW') {
      throw new BadRequestException(`A request in ${request.status} status cannot be decided.`);
    }
    if (request.assignedVerifierId && request.assignedVerifierId !== reviewerId && !reviewerRoles.includes('ADMIN')) {
      throw new ForbiddenException('This request is assigned to another reviewer.');
    }
    if (dto.decision !== 'APPROVE' && !dto.reason) {
      throw new BadRequestException('A reason is required to reject or request more information.');
    }

    const targetStatus: VerificationStatus =
      dto.decision === 'APPROVE' ? 'APPROVED' : dto.decision === 'REJECT' ? 'REJECTED' : 'NEEDS_INFORMATION';

    const updated = await this.prisma.guardianVerificationRequest.update({
      where: { id: requestId },
      data: {
        status: targetStatus,
        decisionReason: dto.reason,
        reviewedAt: new Date(),
        assignedVerifierId: request.assignedVerifierId ?? reviewerId,
      },
      include: GUARDIAN_VERIFICATION_INCLUDE,
    });

    await this.notifications.create(request.guardianUserId, 'VERIFICATION_UPDATED', {
      guardianVerificationRequestId: requestId,
      status: targetStatus,
    });

    return toGuardianVerificationRequestDetailDto(updated);
  }

  private async assertEvidenceUploadedAndValid(evidence: {
    id: string;
    storageKey: string;
    mimeType: string;
    originalFileName: string | null;
  }): Promise<void> {
    const label = evidence.originalFileName ?? evidence.id;

    const metadata = await this.storage.headObject(evidence.storageKey);
    if (!metadata) {
      throw new BadRequestException(`Evidence "${label}" was never uploaded.`);
    }
    if (metadata.contentLength !== undefined && metadata.contentLength > MAX_EVIDENCE_FILE_SIZE_BYTES) {
      throw new BadRequestException(`Evidence "${label}" exceeds the file-size limit.`);
    }

    const signature = MAGIC_BYTES[evidence.mimeType];
    if (signature) {
      const maxOffset = Math.max(...signature.map((s) => s.offset + s.bytes.length));
      const bytes = await this.storage.readLeadingBytes(evidence.storageKey, maxOffset);
      const matches = signature.every((s) => s.bytes.every((b, i) => bytes[s.offset + i] === b));
      if (!matches) {
        throw new BadRequestException(`Evidence "${label}" does not look like a valid ${evidence.mimeType} file.`);
      }
    }
  }

  private async findOrThrow(requestId: string) {
    const request = await this.prisma.guardianVerificationRequest.findUnique({
      where: { id: requestId },
      include: GUARDIAN_VERIFICATION_INCLUDE,
    });
    if (!request) {
      throw new NotFoundException('Verification request not found.');
    }
    return request;
  }

  private async findOwnedOrThrow(userId: string, requestId: string): Promise<GuardianVerificationRow> {
    const request = await this.findOrThrow(requestId);
    if (request.guardianUserId !== userId) {
      throw new NotFoundException('Verification request not found.');
    }
    return request;
  }

  private assertCanView(userId: string, userRoles: Role[], request: { guardianUserId: string }): void {
    const isOwner = request.guardianUserId === userId;
    const isReviewer = REVIEWER_ROLES.some((r) => userRoles.includes(r));
    if (!isOwner && !isReviewer) {
      throw new NotFoundException('Verification request not found.');
    }
  }
}
