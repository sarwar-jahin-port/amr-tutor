import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { toSafeUserDto, type SafeUserDto } from '../../common/dto/safe-user.dto';
import { PrismaService } from '../../database/prisma.service';
import { SELF_REGISTERABLE_ROLES, type SelfRegisterableRole } from '../auth/dto/register.dto';
import type { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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
}
