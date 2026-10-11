import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { DecideGuardianVerificationDto } from './dto/decide-guardian-verification.dto';
import { GuardianVerificationQueueQueryDto } from './dto/guardian-verification-queue-query.dto';
import { GuardianVerificationRequestDetailDto } from './dto/guardian-verification.dto';
import { GuardianVerificationsService } from './guardian-verifications.service';

/** The reviewer's side of guardian identity verification: the review queue and approve/reject/request-more-info decisions. */
@Controller('admin/guardian-verifications')
@Roles(Role.VERIFIER, Role.ADMIN)
export class AdminGuardianVerificationsController {
  constructor(private readonly guardianVerifications: GuardianVerificationsService) {}

  @Get()
  async listQueue(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GuardianVerificationQueueQueryDto,
  ): Promise<{ data: GuardianVerificationRequestDetailDto[] }> {
    const data = await this.guardianVerifications.listQueue(user.id, user.roles, query.status);
    return { data };
  }

  @Post(':id/decision')
  async decide(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecideGuardianVerificationDto,
  ): Promise<{ data: GuardianVerificationRequestDetailDto }> {
    const data = await this.guardianVerifications.decide(user.id, user.roles, id, dto);
    return { data };
  }
}
