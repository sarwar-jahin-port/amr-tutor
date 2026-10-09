import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PaginatedResponse, paginate } from '../../common/dto/pagination-query.dto';
import { toSafeUserDto, type SafeUserDto } from '../../common/dto/safe-user.dto';
import { PrismaService } from '../../database/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { SELF_REGISTERABLE_ROLES, type SelfRegisterableRole } from '../auth/dto/register.dto';
import { AdminUserSearchQueryDto, UpdateUserStatusDto } from './dto/admin-user-search-query.dto';
import type { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async updateMe(userId: string, dto: UpdateMeDto): Promise<SafeUserDto> {
    if (dto.phone) {
      const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
      if (existing && existing.id !== userId) {
        throw new ConflictException('An account with this phone number already exists.');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { phone: dto.phone },
      include: { roles: true },
    });

    return toSafeUserDto(user);
  }

  async addRole(userId: string, role: SelfRegisterableRole): Promise<SafeUserDto> {
    const existing = await this.prisma.userRole.findUnique({
      where: { userId_role: { userId, role } },
    });

    if (existing) {
      throw new ConflictException(`This account already has the ${role} role.`);
    }

    await this.prisma.userRole.create({ data: { userId, role } });

    return this.getSafeUserOrThrow(userId);
  }

  /**
   * Role removal never cascades to applications, listings, or conversation
   * history (blueprint Phase 3: "Removing a role must not silently delete"
   * related data) — deleting a UserRole row only removes the join record.
   */
  async removeRole(userId: string, roleParam: string): Promise<SafeUserDto> {
    if (!this.isSelfManageableRole(roleParam)) {
      throw new BadRequestException(`${roleParam} is not a self-manageable role.`);
    }
    const role = roleParam as SelfRegisterableRole;

    const [existing, roleCount] = await Promise.all([
      this.prisma.userRole.findUnique({ where: { userId_role: { userId, role } } }),
      this.prisma.userRole.count({ where: { userId } }),
    ]);

    if (!existing) {
      throw new NotFoundException(`This account does not have the ${role} role.`);
    }

    if (roleCount <= 1) {
      throw new BadRequestException('An account must keep at least one role.');
    }

    await this.prisma.userRole.delete({ where: { userId_role: { userId, role } } });

    return this.getSafeUserOrThrow(userId);
  }

  private isSelfManageableRole(value: string): value is SelfRegisterableRole {
    return (SELF_REGISTERABLE_ROLES as readonly string[]).includes(value);
  }

  private async getSafeUserOrThrow(userId: string): Promise<SafeUserDto> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { roles: true },
    });
    return toSafeUserDto(user);
  }

  async adminSearch(query: AdminUserSearchQueryDto): Promise<PaginatedResponse<SafeUserDto>> {
    const where = {
      ...(query.search && {
        OR: [
          { email: { contains: query.search, mode: 'insensitive' as const } },
          { phone: { contains: query.search } },
        ],
      }),
      ...(query.role && { roles: { some: { role: query.role } } }),
      ...(query.status && { status: query.status }),
    };

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { roles: true },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginate(rows.map(toSafeUserDto), query.page, query.limit, total);
  }

  async adminGetDetail(userId: string): Promise<SafeUserDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { roles: true } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return toSafeUserDto(user);
  }

  /**
   * Suspending flips status (which JwtAccessStrategy re-checks on every
   * request, so it takes effect immediately) and revokes refresh tokens so
   * the account can't mint a new access token either — belt and braces for
   * "suspensions revoke or invalidate relevant sessions" (blueprint Phase 11).
   */
  async adminUpdateStatus(
    actingAdminId: string,
    targetUserId: string,
    dto: UpdateUserStatusDto,
  ): Promise<SafeUserDto> {
    if (dto.status === 'SUSPENDED' && !dto.reason) {
      throw new BadRequestException('A reason is required to suspend an account.');
    }
    if (dto.status === 'SUSPENDED' && targetUserId === actingAdminId) {
      throw new ForbiddenException('You cannot suspend your own account.');
    }

    const target = await this.prisma.user.findUnique({ where: { id: targetUserId }, include: { roles: true } });
    if (!target) {
      throw new NotFoundException('User not found.');
    }

    if (dto.status === 'SUSPENDED' && target.status === 'ACTIVE' && target.roles.some((r) => r.role === Role.ADMIN)) {
      const otherActiveAdmins = await this.prisma.user.count({
        where: { id: { not: targetUserId }, status: 'ACTIVE', roles: { some: { role: Role.ADMIN } } },
      });
      if (otherActiveAdmins === 0) {
        throw new BadRequestException('Cannot suspend the last active administrator.');
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: targetUserId },
        data: { status: dto.status },
        include: { roles: true },
      });

      if (dto.status === 'SUSPENDED') {
        await tx.refreshToken.updateMany({
          where: { userId: targetUserId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }

      return user;
    });

    await this.auditLog.record({
      actorUserId: actingAdminId,
      action: 'USER_STATUS_CHANGE',
      targetType: 'User',
      targetId: targetUserId,
      outcome: dto.status,
      metadata: { reason: dto.reason },
    });

    return toSafeUserDto(updated);
  }
}
