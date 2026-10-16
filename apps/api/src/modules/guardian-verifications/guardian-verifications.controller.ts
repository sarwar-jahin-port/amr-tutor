import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { GuardianVerificationRequestDetailDto } from './dto/guardian-verification.dto';
import { RequestGuardianEvidenceUploadDto } from './dto/request-guardian-evidence-upload.dto';
import { GuardianVerificationsService } from './guardian-verifications.service';

/**
 * The applicant's side of guardian identity verification, plus the shared
 * detail/evidence-download routes an authorized reviewer also reaches
 * (the service checks participation itself — no @Roles() here). 'me' is
 * declared before ':id' so it can never be swallowed by the dynamic route.
 */
@Controller('guardian-verifications')
export class GuardianVerificationsController {
  constructor(private readonly guardianVerifications: GuardianVerificationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: AuthenticatedUser): Promise<{ data: GuardianVerificationRequestDetailDto }> {
    const data = await this.guardianVerifications.create(user.id);
    return { data };
  }

  @Get('me')
  async listOwn(@CurrentUser() user: AuthenticatedUser): Promise<{ data: GuardianVerificationRequestDetailDto[] }> {
    const data = await this.guardianVerifications.listOwn(user.id);
    return { data };
  }

  @Get(':id')
  async getDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ data: GuardianVerificationRequestDetailDto }> {
    const data = await this.guardianVerifications.getDetail(user.id, user.roles, id);
    return { data };
  }

  @Get(':id/evidence/:evidenceId/download-url')
  async getEvidenceDownloadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('evidenceId', ParseUUIDPipe) evidenceId: string,
  ): Promise<{ data: { downloadUrl: string } }> {
    const downloadUrl = await this.guardianVerifications.getEvidenceDownloadUrl(user.id, user.roles, id, evidenceId);
    return { data: { downloadUrl } };
  }

  @Post(':id/evidence-upload')
  @HttpCode(HttpStatus.CREATED)
  async requestEvidenceUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RequestGuardianEvidenceUploadDto,
  ): Promise<{ data: { evidenceId: string; uploadUrl: string } }> {
    const data = await this.guardianVerifications.requestEvidenceUpload(user.id, id, dto);
    return { data };
  }

  @Post(':id/submit')
  async submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ data: GuardianVerificationRequestDetailDto }> {
    const data = await this.guardianVerifications.submit(user.id, id);
    return { data };
  }
}
