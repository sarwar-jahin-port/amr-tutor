import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EducationLevel, Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { DecideEducationVerificationDto } from './dto/decide-education-verification.dto';
import {
  AdminEducationRecordDto,
  EDUCATION_LEVEL_ORDER,
  EducationRecordDto,
  toAdminEducationRecordDto,
  toEducationRecordDto,
} from './dto/education-record.dto';
import { RequestCertificateUploadDto } from './dto/request-certificate-upload.dto';
import { UpsertEducationRecordDto } from './dto/upsert-education-record.dto';

const REVIEWER_ROLES: Role[] = ['VERIFIER', 'ADMIN'];

/** Entering HSC requires SSC to already exist — enforces the sequential SSC -> HSC hierarchy. University is never upserted here: it's kept in sync with the tutor profile's chosen university by TutorProfileService. */
const LEVEL_PREREQUISITE: Partial<Record<EducationLevel, EducationLevel>> = {
  HSC: 'SSC',
};

@Injectable()
export class EducationRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async listOwn(userId: string): Promise<EducationRecordDto[]> {
    const profile = await this.findProfileOrThrow(userId);
    // Self-heals profiles created before this feature existed, whose
    // University record was never backfilled — see ensureUniversityRecord.
    await this.ensureUniversityRecord(profile);
    const rows = await this.prisma.educationRecord.findMany({ where: { tutorProfileId: profile.id } });
    return this.sortByLevel(rows).map(toEducationRecordDto);
  }

  async upsert(userId: string, level: EducationLevel, dto: UpsertEducationRecordDto): Promise<EducationRecordDto> {
    if (level === 'UNIVERSITY') {
      throw new BadRequestException('University education is managed through your tutor profile, not this endpoint.');
    }
    const profile = await this.findProfileOrThrow(userId);
    await this.assertPrerequisiteMet(profile.id, level);

    const record = await this.prisma.educationRecord.upsert({
      where: { tutorProfileId_level: { tutorProfileId: profile.id, level } },
      create: { tutorProfileId: profile.id, level, institution: dto.institution, gpa: dto.gpa },
      update: { institution: dto.institution, gpa: dto.gpa },
    });

    return toEducationRecordDto(record);
  }

  async requestCertificateUpload(
    userId: string,
    level: EducationLevel,
    dto: RequestCertificateUploadDto,
  ): Promise<{ uploadUrl: string }> {
    const profile = await this.findProfileOrThrow(userId);
    if (level === 'UNIVERSITY') {
      await this.ensureUniversityRecord(profile);
    }

    const record = await this.prisma.educationRecord.findUnique({
      where: { tutorProfileId_level: { tutorProfileId: profile.id, level } },
    });
    if (!record) {
      throw new BadRequestException(`Add your ${level} details before uploading a certificate.`);
    }

    const key = this.storage.generateObjectKey(`education/${record.id}`, dto.originalFileName);

    await this.prisma.educationRecord.update({
      where: { id: record.id },
      data: {
        certificateKey: key,
        certificateFileName: dto.originalFileName ?? null,
        certificateMimeType: dto.contentType,
        certificateSizeBytes: dto.fileSizeBytes,
        // A re-upload replaces whatever was reviewed before, so it must be reviewed again.
        isVerified: false,
      },
    });

    const uploadUrl = await this.storage.generateUploadUrl(key, dto.contentType);
    return { uploadUrl };
  }

  async getOwnCertificateDownloadUrl(userId: string, level: EducationLevel): Promise<string> {
    const profile = await this.findProfileOrThrow(userId);
    const record = await this.prisma.educationRecord.findUnique({
      where: { tutorProfileId_level: { tutorProfileId: profile.id, level } },
    });
    if (!record?.certificateKey) {
      throw new NotFoundException('No certificate has been uploaded for this record.');
    }
    return this.storage.generateDownloadUrl(record.certificateKey);
  }

  /** Reviewer queue: every certificate that's been uploaded but not yet verified. */
  async listPendingForReview(): Promise<AdminEducationRecordDto[]> {
    const rows = await this.prisma.educationRecord.findMany({
      where: { certificateKey: { not: null }, isVerified: false },
      include: { tutorProfile: { select: { id: true, fullName: true } } },
      orderBy: { updatedAt: 'asc' },
    });
    return rows.map(toAdminEducationRecordDto);
  }

  async getCertificateDownloadUrl(userId: string, userRoles: Role[], recordId: string): Promise<string> {
    const record = await this.findRecordOrThrow(recordId);
    this.assertCanView(userId, userRoles, record);

    if (!record.certificateKey) {
      throw new NotFoundException('No certificate has been uploaded for this record.');
    }
    return this.storage.generateDownloadUrl(record.certificateKey);
  }

  async decide(
    reviewerId: string,
    reviewerRoles: Role[],
    recordId: string,
    dto: DecideEducationVerificationDto,
  ): Promise<AdminEducationRecordDto> {
    const record = await this.findRecordOrThrow(recordId);

    if (record.tutorProfile.userId === reviewerId) {
      throw new BadRequestException('You cannot review your own certificate.');
    }
    if (!record.certificateKey) {
      throw new BadRequestException('This record has no certificate to review.');
    }

    const updated = await this.prisma.educationRecord.update({
      where: { id: recordId },
      data: { isVerified: dto.approve },
      include: { tutorProfile: { select: { id: true, fullName: true } } },
    });

    return toAdminEducationRecordDto(updated);
  }

  private async assertPrerequisiteMet(tutorProfileId: string, level: EducationLevel): Promise<void> {
    const prerequisite = LEVEL_PREREQUISITE[level];
    if (!prerequisite) return;

    const prerequisiteRecord = await this.prisma.educationRecord.findUnique({
      where: { tutorProfileId_level: { tutorProfileId, level: prerequisite } },
    });
    if (!prerequisiteRecord) {
      throw new BadRequestException(`Add your ${prerequisite} details before ${level}.`);
    }
  }

  private async findProfileOrThrow(userId: string) {
    const profile = await this.prisma.tutorProfile.findUnique({
      where: { userId },
      include: { university: { select: { name: true } } },
    });
    if (!profile) {
      throw new NotFoundException('Create your tutor profile before adding education records.');
    }
    return profile;
  }

  /**
   * Profiles created before this feature existed never got a University
   * EducationRecord (TutorProfileService only creates/syncs it on
   * create/update of the profile itself) — backfill it lazily so the
   * University card and its certificate upload are always available.
   */
  private async ensureUniversityRecord(profile: { id: string; university: { name: string } }): Promise<void> {
    await this.prisma.educationRecord.upsert({
      where: { tutorProfileId_level: { tutorProfileId: profile.id, level: 'UNIVERSITY' } },
      create: { tutorProfileId: profile.id, level: 'UNIVERSITY', institution: profile.university.name },
      update: {},
    });
  }

  private async findRecordOrThrow(recordId: string) {
    const record = await this.prisma.educationRecord.findUnique({
      where: { id: recordId },
      include: { tutorProfile: { select: { id: true, userId: true, fullName: true } } },
    });
    if (!record) {
      throw new NotFoundException('Education record not found.');
    }
    return record;
  }

  private assertCanView(userId: string, userRoles: Role[], record: { tutorProfile: { userId: string } }): void {
    const isOwner = record.tutorProfile.userId === userId;
    const isReviewer = REVIEWER_ROLES.some((r) => userRoles.includes(r));
    if (!isOwner && !isReviewer) {
      throw new NotFoundException('Education record not found.');
    }
  }

  private sortByLevel<T extends { level: EducationLevel }>(rows: T[]): T[] {
    return [...rows].sort((a, b) => EDUCATION_LEVEL_ORDER.indexOf(a.level) - EDUCATION_LEVEL_ORDER.indexOf(b.level));
  }
}
