import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { DecideEducationVerificationDto } from './dto/decide-education-verification.dto';
import { AdminEducationRecordDto } from './dto/education-record.dto';
import { EducationRecordsService } from './education-records.service';

/** The reviewer's side of SSC/HSC/University certificate verification: the pending-review queue and approve/reject decisions. */
@Controller('admin/education-records')
@Roles(Role.VERIFIER, Role.ADMIN)
export class AdminEducationRecordsController {
  constructor(private readonly educationRecordsService: EducationRecordsService) {}

  @Get('pending')
  async listPending(): Promise<{ data: AdminEducationRecordDto[] }> {
    const data = await this.educationRecordsService.listPendingForReview();
    return { data };
  }

  @Get(':id/certificate-download-url')
  async getCertificateDownloadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ data: { downloadUrl: string } }> {
    const downloadUrl = await this.educationRecordsService.getCertificateDownloadUrl(user.id, user.roles, id);
    return { data: { downloadUrl } };
  }

  @Post(':id/decision')
  async decide(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecideEducationVerificationDto,
  ): Promise<{ data: AdminEducationRecordDto }> {
    const data = await this.educationRecordsService.decide(user.id, user.roles, id, dto);
    return { data };
  }
}
