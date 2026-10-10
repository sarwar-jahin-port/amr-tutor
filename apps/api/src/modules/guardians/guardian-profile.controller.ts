import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { CreateGuardianProfileDto, UpdateGuardianProfileDto } from './dto/guardian-profile.dto';
import { GuardianProfileDto, GuardianProfileService } from './guardian-profile.service';

/** Guardian onboarding (blueprint Phase 7). Every route requires the GUARDIAN role. */
@Controller('guardians/me')
@Roles(Role.GUARDIAN)
export class GuardianProfileController {
  constructor(private readonly guardianProfileService: GuardianProfileService) {}

  @Post('profile')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateGuardianProfileDto,
  ): Promise<{ data: GuardianProfileDto }> {
    const data = await this.guardianProfileService.create(user.id, dto);
    return { data };
  }

  @Get('profile')
  async getOwn(@CurrentUser() user: AuthenticatedUser): Promise<{ data: GuardianProfileDto }> {
    const data = await this.guardianProfileService.getOwn(user.id);
    return { data };
  }

  @Patch('profile')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateGuardianProfileDto,
  ): Promise<{ data: GuardianProfileDto }> {
    const data = await this.guardianProfileService.update(user.id, dto);
    return { data };
  }
}
