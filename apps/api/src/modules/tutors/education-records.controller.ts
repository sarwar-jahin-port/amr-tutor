import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseEnumPipe, Post, Put } from '@nestjs/common';
import { EducationLevel, Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { EducationRecordDto } from './dto/education-record.dto';
import { RequestCertificateUploadDto } from './dto/request-certificate-upload.dto';
import { UpsertEducationRecordDto } from './dto/upsert-education-record.dto';
import { EducationRecordsService } from './education-records.service';

/** A tutor's own SSC/HSC/University education records, each with an optional certificate upload (Academic background step). */
@Controller('tutors/me/education')
@Roles(Role.TUTOR)
export class EducationRecordsController {
  constructor(private readonly educationRecordsService: EducationRecordsService) {}

  @Get()
  async listOwn(@CurrentUser() user: AuthenticatedUser): Promise<{ data: EducationRecordDto[] }> {
    const data = await this.educationRecordsService.listOwn(user.id);
    return { data };
  }

  @Put(':level')
  async upsert(
    @CurrentUser() user: AuthenticatedUser,
    @Param('level', new ParseEnumPipe(EducationLevel)) level: EducationLevel,
    @Body() dto: UpsertEducationRecordDto,
  ): Promise<{ data: EducationRecordDto }> {
    const data = await this.educationRecordsService.upsert(user.id, level, dto);
    return { data };
  }

  @Post(':level/certificate-upload')
  @HttpCode(HttpStatus.CREATED)
  async requestCertificateUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('level', new ParseEnumPipe(EducationLevel)) level: EducationLevel,
    @Body() dto: RequestCertificateUploadDto,
  ): Promise<{ data: { uploadUrl: string } }> {
    const data = await this.educationRecordsService.requestCertificateUpload(user.id, level, dto);
    return { data };
  }

  @Get(':level/certificate-download-url')
  async getCertificateDownloadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Param('level', new ParseEnumPipe(EducationLevel)) level: EducationLevel,
  ): Promise<{ data: { downloadUrl: string } }> {
    const downloadUrl = await this.educationRecordsService.getOwnCertificateDownloadUrl(user.id, level);
    return { data: { downloadUrl } };
  }
}
