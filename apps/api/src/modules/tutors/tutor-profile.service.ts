import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTutorProfileDto } from './dto/create-tutor-profile.dto';
import { LocationInputDto, ReplaceLocationsDto } from './dto/replace-locations.dto';
import { ReplaceAvailabilityDto } from './dto/replace-availability.dto';
import { ReplaceCurriculaDto } from './dto/replace-curricula.dto';
import { ReplaceGradesDto } from './dto/replace-grades.dto';
import { ReplaceSubjectsDto } from './dto/replace-subjects.dto';
import { UpdateTutorProfileDto } from './dto/update-tutor-profile.dto';
import { PublicTutorProfileDto, TUTOR_PROFILE_INCLUDE, toPublicTutorProfileDto } from './dto/public-tutor.dto';

@Injectable()
export class TutorProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTutorProfileDto): Promise<PublicTutorProfileDto> {
    const existing = await this.prisma.tutorProfile.findUnique({ where: { userId } });
    if (existing) {
      throw new ConflictException('A tutor profile already exists for this account.');
    }

    await this.assertUniversityActive(dto.universityId);
    this.assertFeeRangeValid(dto.preferredFeeMin, dto.preferredFeeMax);

    const profile = await this.prisma.tutorProfile.create({
      data: {
        userId,
        universityId: dto.universityId,
        fullName: dto.fullName,
        department: dto.department,
        degreeProgram: dto.degreeProgram,
        academicStatus: dto.academicStatus,
        academicYear: dto.academicYear,
        introduction: dto.introduction,
        preferredFeeMin: dto.preferredFeeMin,
        preferredFeeMax: dto.preferredFeeMax,
        isAvailable: dto.isAvailable ?? true,
      },
      include: TUTOR_PROFILE_INCLUDE,
    });

    return toPublicTutorProfileDto(profile);
  }

  async getOwn(userId: string): Promise<PublicTutorProfileDto> {
    const profile = await this.findOwnedOrThrow(userId);
    return toPublicTutorProfileDto(profile);
  }

  async update(userId: string, dto: UpdateTutorProfileDto): Promise<PublicTutorProfileDto> {
    const existing = await this.findOwnedOrThrow(userId);

    if (dto.universityId) {
      await this.assertUniversityActive(dto.universityId);
    }

    this.assertFeeRangeValid(
      dto.preferredFeeMin ?? existing.preferredFeeMin ?? undefined,
      dto.preferredFeeMax ?? existing.preferredFeeMax ?? undefined,
    );

    const profile = await this.prisma.tutorProfile.update({
      where: { userId },
      data: {
        universityId: dto.universityId,
        fullName: dto.fullName,
        department: dto.department,
        degreeProgram: dto.degreeProgram,
        academicStatus: dto.academicStatus,
        academicYear: dto.academicYear,
        introduction: dto.introduction,
        preferredFeeMin: dto.preferredFeeMin,
        preferredFeeMax: dto.preferredFeeMax,
        isAvailable: dto.isAvailable,
      },
      include: TUTOR_PROFILE_INCLUDE,
    });

    return toPublicTutorProfileDto(profile);
  }

  async replaceSubjects(userId: string, dto: ReplaceSubjectsDto): Promise<PublicTutorProfileDto> {
    const profile = await this.findOwnedOrThrow(userId);
    await this.assertActiveIds('subject', dto.subjectIds);

    await this.prisma.$transaction(async (tx) => {
      await tx.tutorSubject.deleteMany({ where: { tutorProfileId: profile.id } });
      await tx.tutorSubject.createMany({
        data: dto.subjectIds.map((subjectId) => ({ tutorProfileId: profile.id, subjectId })),
      });
    });

    return this.getOwn(userId);
  }

  async replaceGrades(userId: string, dto: ReplaceGradesDto): Promise<PublicTutorProfileDto> {
    const profile = await this.findOwnedOrThrow(userId);

    await this.prisma.$transaction(async (tx) => {
      await tx.tutorGrade.deleteMany({ where: { tutorProfileId: profile.id } });
      await tx.tutorGrade.createMany({
        data: dto.gradeLevels.map((gradeLevel) => ({ tutorProfileId: profile.id, gradeLevel })),
      });
    });

    return this.getOwn(userId);
  }

  async replaceCurricula(userId: string, dto: ReplaceCurriculaDto): Promise<PublicTutorProfileDto> {
    const profile = await this.findOwnedOrThrow(userId);
    await this.assertActiveIds('curriculum', dto.curriculumIds);

    await this.prisma.$transaction(async (tx) => {
      await tx.tutorCurriculum.deleteMany({ where: { tutorProfileId: profile.id } });
      await tx.tutorCurriculum.createMany({
        data: dto.curriculumIds.map((curriculumId) => ({ tutorProfileId: profile.id, curriculumId })),
      });
    });

    return this.getOwn(userId);
  }

  async replaceLocations(userId: string, dto: ReplaceLocationsDto): Promise<PublicTutorProfileDto> {
    const profile = await this.findOwnedOrThrow(userId);

    await this.prisma.$transaction(async (tx) => {
      await tx.tutorLocation.deleteMany({ where: { tutorProfileId: profile.id } });
      await tx.tutorLocation.createMany({
        data: dto.locations.map((location: LocationInputDto) => ({
          tutorProfileId: profile.id,
          city: location.city,
          area: location.area,
          neighborhood: location.neighborhood,
        })),
      });
    });

    return this.getOwn(userId);
  }

  async replaceAvailability(userId: string, dto: ReplaceAvailabilityDto): Promise<PublicTutorProfileDto> {
    const profile = await this.findOwnedOrThrow(userId);
    const slots = dto.slots.map((slot) => {
      const startMinute = this.toMinutes(slot.startTime);
      const endMinute = this.toMinutes(slot.endTime);
      if (startMinute >= endMinute) {
        throw new BadRequestException(
          `startTime (${slot.startTime}) must be earlier than endTime (${slot.endTime}).`,
        );
      }
      return { tutorProfileId: profile.id, day: slot.day, startMinute, endMinute };
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.tutorAvailability.deleteMany({ where: { tutorProfileId: profile.id } });
      await tx.tutorAvailability.createMany({ data: slots });
    });

    return this.getOwn(userId);
  }

  private async findOwnedOrThrow(userId: string) {
    const profile = await this.prisma.tutorProfile.findUnique({
      where: { userId },
      include: TUTOR_PROFILE_INCLUDE,
    });

    if (!profile) {
      throw new NotFoundException('Create a tutor profile before updating it.');
    }

    return profile;
  }

  private async assertUniversityActive(universityId: string): Promise<void> {
    const university = await this.prisma.university.findFirst({
      where: { id: universityId, isActive: true },
    });
    if (!university) {
      throw new BadRequestException('universityId must reference an active university.');
    }
  }

  private async assertActiveIds(model: 'subject' | 'curriculum', ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const where = { id: { in: ids }, isActive: true };
    const count =
      model === 'subject'
        ? await this.prisma.subject.count({ where })
        : await this.prisma.curriculum.count({ where });

    if (count !== ids.length) {
      throw new BadRequestException(`Every ${model}Id must reference an active ${model}.`);
    }
  }

  private assertFeeRangeValid(min: number | undefined, max: number | undefined): void {
    if (min !== undefined && max !== undefined && min > max) {
      throw new BadRequestException('preferredFeeMin cannot exceed preferredFeeMax.');
    }
  }

  /** `time` is already validated against a strict HH:mm pattern by ReplaceAvailabilityDto. */
  private toMinutes(time: string): number {
    const [hoursPart, minutesPart] = time.split(':');
    return Number(hoursPart) * 60 + Number(minutesPart);
  }
}
