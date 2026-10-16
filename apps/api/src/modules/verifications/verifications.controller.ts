import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { CreateVerificationRequestDto } from './dto/create-verification-request.dto';
import { RequestEvidenceUploadDto } from './dto/request-evidence-upload.dto';
import { VerificationRequestDetailDto } from './dto/verification.dto';
import { VerificationsService } from './verifications.service';

/**
 * The applicant's side of verification (blueprint Phase 10), plus the
 * shared detail/evidence-download routes an authorized reviewer also
 * reaches (VerificationsService checks participation itself — no @Roles()
 * here, matching docs/api_spec.md's "Authenticated user" / "Applicant or
 * authorized reviewer" access column). 'me' is declared before ':id' so it
 * can never be swallowed by the dynamic route.
 */
@Controller('verifications')
export class VerificationsController {
  constructor(private readonly verificationsService: VerificationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateVerificationRequestDto,
  ): Promise<{ data: VerificationRequestDetailDto }> {
    const data = await this.verificationsService.create(user.id, dto);
    return { data };
  }

  @Get('me')
  async listOwn(@CurrentUser() user: AuthenticatedUser): Promise<{ data: VerificationRequestDetailDto[] }> {
    const data = await this.verificationsService.listOwn(user.id);
    return { data };
  }

  @Get(':id')
  async getDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ data: VerificationRequestDetailDto }> {
    const data = await this.verificationsService.getDetail(user.id, user.roles, id);
    return { data };
  }

  @Get(':id/evidence/:evidenceId/download-url')
  async getEvidenceDownloadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('evidenceId', ParseUUIDPipe) evidenceId: string,
  ): Promise<{ data: { downloadUrl: string } }> {
    const downloadUrl = await this.verificationsService.getEvidenceDownloadUrl(user.id, user.roles, id, evidenceId);
    return { data: { downloadUrl } };
  }

  @Post(':id/evidence-upload')
  @HttpCode(HttpStatus.CREATED)
  async requestEvidenceUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RequestEvidenceUploadDto,
  ): Promise<{ data: { evidenceId: string; uploadUrl: string } }> {
    const data = await this.verificationsService.requestEvidenceUpload(user.id, id, dto);
    return { data };
  }

  @Post(':id/submit')
  async submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ data: VerificationRequestDetailDto }> {
    const data = await this.verificationsService.submit(user.id, id);
    return { data };
  }
}
