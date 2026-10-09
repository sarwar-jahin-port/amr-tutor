import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateGuardianProfileDto, UpdateGuardianProfileDto } from './dto/guardian-profile.dto';

export interface GuardianProfileDto {
  id: string;
  displayName: string;
  language: string | null;
}

function toDto(profile: { id: string; displayName: string; language: string | null }): GuardianProfileDto {
  return { id: profile.id, displayName: profile.displayName, language: profile.language };
}

@Injectable()
export class GuardianProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateGuardianProfileDto): Promise<GuardianProfileDto> {
    const existing = await this.prisma.guardianProfile.findUnique({ where: { userId } });
    if (existing) {
      throw new ConflictException('A guardian profile already exists for this account.');
    }

    const profile = await this.prisma.guardianProfile.create({
      data: { userId, displayName: dto.displayName, language: dto.language },
    });

    return toDto(profile);
  }

  async getOwn(userId: string): Promise<GuardianProfileDto> {
    const profile = await this.findOwnedOrThrow(userId);
    return toDto(profile);
  }

  async update(userId: string, dto: UpdateGuardianProfileDto): Promise<GuardianProfileDto> {
    await this.findOwnedOrThrow(userId);

    const profile = await this.prisma.guardianProfile.update({
      where: { userId },
      data: { displayName: dto.displayName, language: dto.language },
    });

    return toDto(profile);
  }

  private async findOwnedOrThrow(userId: string) {
    const profile = await this.prisma.guardianProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Create a guardian profile before updating it.');
    }
    return profile;
  }
}
