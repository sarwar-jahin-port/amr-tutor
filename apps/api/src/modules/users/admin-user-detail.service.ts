import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { toSafeUserDto, type SafeUserDto } from '../../common/dto/safe-user.dto';
import { PrismaService } from '../../database/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { AuthService } from '../auth/auth.service';
import { GuardianProfileService } from '../guardians/guardian-profile.service';
import { TutorProfileService } from '../tutors/tutor-profile.service';
import type { UpdateTutorProfileDto } from '../tutors/dto/update-tutor-profile.dto';
import type { UpdateGuardianProfileDto } from '../guardians/dto/guardian-profile.dto';
import type { AdminChangeRoleDto } from './dto/admin-change-role.dto';
import type { CreateAdminNoteDto, AdminNoteDto } from './dto/admin-note.dto';
import type { AdminUserDetailDto } from './dto/admin-user-detail.dto';

const RECENT_LIMIT = 10;
const IMPERSONATION_BLOCKED_ROLES: Role[] = [Role.ADMIN, Role.MODERATOR, Role.VERIFIER];

@Injectable()
export class AdminUserDetailService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly tutorProfiles: TutorProfileService,
    private readonly guardianProfiles: GuardianProfileService,
    private readonly auth: AuthService,
  ) {}

  async getDetail(userId: string): Promise<AdminUserDetailDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { roles: true } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    const roles = user.roles.map((r) => r.role);

    const [
      tutorProfile,
      tutorAvailability,
      guardianProfile,
      listings,
      applications,
      verificationRequests,
      guardianVerificationRequests,
      reportsFiled,
      reportsAgainst,
      notes,
    ] = await Promise.all([
      roles.includes(Role.TUTOR) ? this.tutorProfiles.getOwn(userId).catch(() => null) : Promise.resolve(null),
      roles.includes(Role.TUTOR)
        ? this.prisma.tutorProfile.findUnique({ where: { userId }, select: { isAvailable: true } })
        : Promise.resolve(null),
      roles.includes(Role.GUARDIAN) ? this.guardianProfiles.getOwn(userId).catch(() => null) : Promise.resolve(null),
      this.prisma.tuitionListing.findMany({
        where: { guardianUserId: userId },
        select: { id: true, title: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: RECENT_LIMIT,
      }),
      this.prisma.application.findMany({
        where: { tutorProfile: { userId } },
        select: { id: true, listingId: true, status: true, submittedAt: true, listing: { select: { title: true } } },
        orderBy: { submittedAt: 'desc' },
        take: RECENT_LIMIT,
      }),
      this.prisma.verificationRequest.findMany({
        where: { tutorProfile: { userId } },
        select: { id: true, type: true, status: true, submittedAt: true },
        orderBy: { submittedAt: 'desc' },
        take: RECENT_LIMIT,
      }),
      this.prisma.guardianVerificationRequest.findMany({
        where: { guardianUserId: userId },
        select: { id: true, status: true, submittedAt: true },
        orderBy: { submittedAt: 'desc' },
        take: RECENT_LIMIT,
      }),
      this.prisma.report.findMany({
        where: { reporterUserId: userId },
        select: { id: true, category: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: RECENT_LIMIT,
      }),
      this.prisma.report.findMany({
        where: { targetUserId: userId },
        select: { id: true, category: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: RECENT_LIMIT,
      }),
      this.prisma.adminNote.findMany({
        where: { targetUserId: userId },
        include: { authorUser: { select: { id: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      user: toSafeUserDto(user),
      tutorProfile,
      tutorIsAvailable: tutorAvailability?.isAvailable ?? null,
      guardianProfile,
      activity: {
        listings,
        applications: applications.map((a) => ({
          id: a.id,
          listingId: a.listingId,
          listingTitle: a.listing.title,
          status: a.status,
          submittedAt: a.submittedAt,
        })),
        verificationRequests,
        guardianVerificationRequests: guardianVerificationRequests.map((v) => ({
          id: v.id,
          type: 'IDENTITY',
          status: v.status,
          submittedAt: v.submittedAt,
        })),
        reportsFiled,
        reportsAgainst,
      },
      notes: notes.map(toNoteDto),
    };
  }

  /**
   * Mirrors the self-manageable-role guards in UsersService (keep >=1 role,
   * never strand the platform with zero active admins) but allows ANY role
   * — including the elevated ones self-service can't touch.
   */
  async changeRole(actingAdminId: string, targetUserId: string, dto: AdminChangeRoleDto): Promise<AdminUserDetailDto> {
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId }, include: { roles: true } });
    if (!target) {
      throw new NotFoundException('User not found.');
    }

    if (dto.action === 'ADD') {
      const exists = target.roles.some((r) => r.role === dto.role);
      if (!exists) {
        await this.prisma.userRole.create({ data: { userId: targetUserId, role: dto.role } });
      }
    } else {
      if (target.roles.length <= 1) {
        throw new BadRequestException('An account must keep at least one role.');
      }
      if (dto.role === Role.ADMIN) {
        const otherAdmins = await this.prisma.user.count({
          where: { id: { not: targetUserId }, status: 'ACTIVE', roles: { some: { role: Role.ADMIN } } },
        });
        if (otherAdmins === 0) {
          throw new BadRequestException('Cannot remove the last administrator.');
        }
      }
      await this.prisma.userRole.deleteMany({ where: { userId: targetUserId, role: dto.role } });
    }

    await this.auditLog.record({
      actorUserId: actingAdminId,
      action: 'USER_ROLE_CHANGE',
      targetType: 'User',
      targetId: targetUserId,
      outcome: `${dto.action}:${dto.role}`,
    });

    return this.getDetail(targetUserId);
  }

  async revokeSessions(actingAdminId: string, targetUserId: string): Promise<void> {
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) {
      throw new NotFoundException('User not found.');
    }

    await this.prisma.refreshToken.updateMany({
      where: { userId: targetUserId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.auditLog.record({
      actorUserId: actingAdminId,
      action: 'USER_SESSIONS_REVOKED',
      targetType: 'User',
      targetId: targetUserId,
      outcome: 'REVOKED',
    });
  }

  async addNote(actingAdminId: string, targetUserId: string, dto: CreateAdminNoteDto): Promise<AdminNoteDto> {
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) {
      throw new NotFoundException('User not found.');
    }

    const note = await this.prisma.adminNote.create({
      data: { targetUserId, authorUserId: actingAdminId, body: dto.body },
      include: { authorUser: { select: { id: true, email: true } } },
    });

    await this.auditLog.record({
      actorUserId: actingAdminId,
      action: 'USER_NOTE_ADDED',
      targetType: 'User',
      targetId: targetUserId,
      outcome: 'ADDED',
    });

    return toNoteDto(note);
  }

  async updateTutorProfile(targetUserId: string, dto: UpdateTutorProfileDto) {
    return this.tutorProfiles.update(targetUserId, dto);
  }

  async updateGuardianProfile(targetUserId: string, dto: UpdateGuardianProfileDto) {
    return this.guardianProfiles.update(targetUserId, dto);
  }

  /**
   * Support "view as": issues a short-lived, refresh-token-less access token
   * for the target so an admin can see exactly what they see. Restricted to
   * plain TUTOR/GUARDIAN accounts — never another staff account, and never
   * the admin's own — so this can't be used as a privilege-escalation path.
   */
  async impersonate(
    actingAdminId: string,
    targetUserId: string,
  ): Promise<{ accessToken: string; expiresInSeconds: number; user: SafeUserDto }> {
    if (targetUserId === actingAdminId) {
      throw new BadRequestException('You cannot impersonate your own account.');
    }

    const target = await this.prisma.user.findUnique({ where: { id: targetUserId }, include: { roles: true } });
    if (!target) {
      throw new NotFoundException('User not found.');
    }
    if (target.status !== 'ACTIVE') {
      throw new BadRequestException('Only active accounts can be viewed as.');
    }

    const roles = target.roles.map((r) => r.role);
    if (roles.some((role) => IMPERSONATION_BLOCKED_ROLES.includes(role))) {
      throw new ForbiddenException('Staff accounts (admin, moderator, verifier) cannot be impersonated.');
    }

    const { accessToken, expiresInSeconds } = this.auth.issueImpersonationToken(targetUserId, roles, actingAdminId);

    await this.auditLog.record({
      actorUserId: actingAdminId,
      action: 'USER_IMPERSONATION_STARTED',
      targetType: 'User',
      targetId: targetUserId,
      outcome: 'STARTED',
    });

    return { accessToken, expiresInSeconds, user: toSafeUserDto(target) };
  }
}

function toNoteDto(note: { id: string; body: string; createdAt: Date; authorUser: { id: string; email: string | null } }): AdminNoteDto {
  return { id: note.id, body: note.body, author: note.authorUser, createdAt: note.createdAt };
}
