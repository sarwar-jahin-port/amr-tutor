import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Role, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateVerificationRequestDto } from './dto/create-verification-request.dto';
import { DecideVerificationDto } from './dto/decide-verification.dto';
import { MAX_EVIDENCE_FILE_SIZE_BYTES, RequestEvidenceUploadDto } from './dto/request-evidence-upload.dto';
import { VERIFICATION_INCLUDE, VerificationRequestDetailDto, toVerificationRequestDetailDto } from './dto/verification.dto';

/** The leading bytes of each allowed content type — checked against the stored object itself, not the client's claim. */
const MAGIC_BYTES: Record<string, { offset: number; bytes: number[] }[]> = {
  'image/jpeg': [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  'image/png': [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  'image/webp': [
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // "RIFF"
    { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }, // "WEBP"
  ],
  'application/pdf': [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] }], // "%PDF-"
};

const NON_TERMINAL_STATUSES: VerificationStatus[] = ['PENDING', 'IN_REVIEW', 'NEEDS_INFORMATION'];
/** Evidence can be (re-)attached while gathering (PENDING) or after a reviewer asks for more (NEEDS_INFORMATION) — never mid-review or after a final decision. */
const EVIDENCE_UPLOAD_STATUSES: VerificationStatus[] = ['PENDING', 'NEEDS_INFORMATION'];
const SUBMITTABLE_STATUSES: VerificationStatus[] = ['PENDING', 'NEEDS_INFORMATION'];
const REVIEWER_ROLES: Role[] = ['VERIFIER', 'ADMIN'];

type VerificationRow = Awaited<ReturnType<VerificationsService['findOrThrow']>>;

@Injectable()
export class VerificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateVerificationRequestDto): Promise<VerificationRequestDetailDto> {
    const tutorProfile = await this.prisma.tutorProfile.findUnique({ where: { userId } });
    if (!tutorProfile) {
      throw new BadRequestException('Create your tutor profile before requesting verification.');
    }

    const existing = await this.prisma.verificationRequest.findFirst({
      where: { tutorProfileId: tutorProfile.id, type: dto.type, status: { in: NON_TERMINAL_STATUSES } },
    });
    if (existing) {
      throw new ConflictException('You already have an active verification request of this type.');
    }

    const request = await this.prisma.verificationRequest.create({
      data: { tutorProfileId: tutorProfile.id, type: dto.type },
      include: VERIFICATION_INCLUDE,
    });

    return toVerificationRequestDetailDto(request);
  }

  async listOwn(userId: string): Promise<VerificationRequestDetailDto[]> {
    const tutorProfile = await this.prisma.tutorProfile.findUnique({ where: { userId } });
    if (!tutorProfile) return [];

    const rows = await this.prisma.verificationRequest.findMany({
      where: { tutorProfileId: tutorProfile.id },
      include: VERIFICATION_INCLUDE,
      orderBy: { submittedAt: 'desc' },
    });
    return rows.map(toVerificationRequestDetailDto);
  }

  async getDetail(userId: string, userRoles: Role[], requestId: string): Promise<VerificationRequestDetailDto> {
    const request = await this.findOrThrow(requestId);
    this.assertCanView(userId, userRoles, request);
    return toVerificationRequestDetailDto(request);
  }

  async requestEvidenceUpload(
    userId: string,
    requestId: string,
    dto: RequestEvidenceUploadDto,
  ): Promise<{ evidenceId: string; uploadUrl: string }> {
    const request = await this.findOwnedOrThrow(userId, requestId);

    if (!EVIDENCE_UPLOAD_STATUSES.includes(request.status)) {
      throw new BadRequestException(`Evidence cannot be added while this request is ${request.status}.`);
    }

    const key = this.storage.generateObjectKey(`verification/${requestId}`, dto.originalFileName);

    const evidence = await this.prisma.verificationEvidence.create({
      data: {
        verificationRequestId: requestId,
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

  async submit(userId: string, requestId: string): Promise<VerificationRequestDetailDto> {
    const request = await this.findOwnedOrThrow(userId, requestId);

    if (!SUBMITTABLE_STATUSES.includes(request.status)) {
      throw new BadRequestException(`A request in ${request.status} status cannot be submitted.`);
    }
    if (request.evidence.length === 0) {
      throw new BadRequestException('Attach at least one piece of evidence before submitting.');
    }

    // Independently verifies every attached evidence item was actually
    // uploaded and is what it claims to be — a presigned URL being issued
    // doesn't mean the client used it, and the client-declared contentType
    // is untrusted (blueprint Phase 10: "the actual file type is checked
    // independently of the client-provided MIME type").
    for (const item of request.evidence) {
      await this.assertEvidenceUploadedAndValid(item);
    }

    const updated = await this.prisma.verificationRequest.update({
      where: { id: requestId },
      data: { status: 'IN_REVIEW' },
      include: VERIFICATION_INCLUDE,
    });

    return toVerificationRequestDetailDto(updated);
  }

  async getEvidenceDownloadUrl(
    userId: string,
    userRoles: Role[],
    requestId: string,
    evidenceId: string,
  ): Promise<string> {
    const request = await this.findOrThrow(requestId);
    this.assertCanView(userId, userRoles, request);

    const evidence = request.evidence.find((e) => e.id === evidenceId);
    if (!evidence) {
      throw new NotFoundException('Evidence not found.');
    }

    return this.storage.generateDownloadUrl(evidence.storageKey);
  }

  /**
   * VERIFIER sees only unassigned requests (available to claim) and ones
   * already assigned to them; ADMIN sees every request in the given status
   * (TRD §3.2 permission table: "Access private identity evidence" —
   * Verifier "assigned cases only", Admin "explicitly authorized" / unrestricted).
   */
  async listQueue(userId: string, userRoles: Role[], status: VerificationStatus): Promise<VerificationRequestDetailDto[]> {
    const isAdmin = userRoles.includes('ADMIN');

    const rows = await this.prisma.verificationRequest.findMany({
      where: {
        status,
        ...(isAdmin ? {} : { OR: [{ assignedVerifierId: null }, { assignedVerifierId: userId }] }),
      },
      include: VERIFICATION_INCLUDE,
      orderBy: { submittedAt: 'asc' },
    });

    return rows.map(toVerificationRequestDetailDto);
  }

  async decide(
    reviewerId: string,
    reviewerRoles: Role[],
    requestId: string,
    dto: DecideVerificationDto,
  ): Promise<VerificationRequestDetailDto> {
    const request = await this.findOrThrow(requestId);

    // Never allow a user to approve/reject their own verification, even if
    // they also happen to hold a reviewer role (blueprint Phase 10 security
    // requirement: "Prevent self-approval").
    if (request.tutorProfile.userId === reviewerId) {
      throw new ForbiddenException('You cannot review your own verification request.');
    }
    if (request.status !== 'IN_REVIEW') {
      throw new BadRequestException(`A request in ${request.status} status cannot be decided.`);
    }
    // First reviewer to act claims the case; a VERIFIER (not ADMIN) can't
    // then take over a case already claimed by someone else.
    if (request.assignedVerifierId && request.assignedVerifierId !== reviewerId && !reviewerRoles.includes('ADMIN')) {
      throw new ForbiddenException('This request is assigned to another reviewer.');
    }
    if (dto.decision !== 'APPROVE' && !dto.reason) {
      throw new BadRequestException('A reason is required to reject or request more information.');
    }

    const targetStatus: VerificationStatus =
      dto.decision === 'APPROVE' ? 'APPROVED' : dto.decision === 'REJECT' ? 'REJECTED' : 'NEEDS_INFORMATION';

    const updated = await this.prisma.verificationRequest.update({
      where: { id: requestId },
      data: {
        status: targetStatus,
        decisionReason: dto.reason,
        reviewedAt: new Date(),
        assignedVerifierId: request.assignedVerifierId ?? reviewerId,
      },
      include: VERIFICATION_INCLUDE,
    });

    await this.notifications.create(request.tutorProfile.userId, 'VERIFICATION_UPDATED', {
      verificationRequestId: requestId,
      status: targetStatus,
    });

    return toVerificationRequestDetailDto(updated);
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
    const request = await this.prisma.verificationRequest.findUnique({
      where: { id: requestId },
      include: VERIFICATION_INCLUDE,
    });
    if (!request) {
      throw new NotFoundException('Verification request not found.');
    }
    return request;
  }

  private async findOwnedOrThrow(userId: string, requestId: string): Promise<VerificationRow> {
    const request = await this.findOrThrow(requestId);
    if (request.tutorProfile.userId !== userId) {
      throw new NotFoundException('Verification request not found.');
    }
    return request;
  }

  private assertCanView(userId: string, userRoles: Role[], request: { tutorProfile: { userId: string } }): void {
    const isOwner = request.tutorProfile.userId === userId;
    const isReviewer = REVIEWER_ROLES.some((r) => userRoles.includes(r));
    if (!isOwner && !isReviewer) {
      throw new NotFoundException('Verification request not found.');
    }
  }
}
