import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { DecideVerificationDto } from './dto/decide-verification.dto';
import { VerificationQueueQueryDto } from './dto/verification-queue-query.dto';
import { VerificationRequestDetailDto } from './dto/verification.dto';
import { VerificationsService } from './verifications.service';

/** The reviewer's side of verification (blueprint Phase 10): the review queue and approve/reject/request-more-info decisions. */
@Controller('admin/verifications')
@Roles(Role.VERIFIER, Role.ADMIN)
export class AdminVerificationsController {
  constructor(private readonly verificationsService: VerificationsService) {}

  @Get()
  async listQueue(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: VerificationQueueQueryDto,
  ): Promise<{ data: VerificationRequestDetailDto[] }> {
    const data = await this.verificationsService.listQueue(user.id, user.roles, query.status);
    return { data };
  }

  @Post(':id/decision')
  async decide(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecideVerificationDto,
  ): Promise<{ data: VerificationRequestDetailDto }> {
    const data = await this.verificationsService.decide(user.id, user.roles, id, dto);
    return { data };
  }
}
