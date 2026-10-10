import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Put } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { CreateTutorProfileDto } from './dto/create-tutor-profile.dto';
import { PublicTutorProfileDto } from './dto/public-tutor.dto';
import { ReplaceAvailabilityDto } from './dto/replace-availability.dto';
import { ReplaceCurriculaDto } from './dto/replace-curricula.dto';
import { ReplaceGradesDto } from './dto/replace-grades.dto';
import { ReplaceLocationsDto } from './dto/replace-locations.dto';
import { ReplaceSubjectsDto } from './dto/replace-subjects.dto';
import { UpdateTutorProfileDto } from './dto/update-tutor-profile.dto';
import { TutorProfileService } from './tutor-profile.service';

/**
 * Tutor onboarding (blueprint Phase 6). Every route requires the TUTOR
 * role — these are the authenticated "my profile" actions, distinct from
 * TutorsController's public search/detail endpoints.
 */
@Controller('tutors/me')
@Roles(Role.TUTOR)
export class TutorProfileController {
  constructor(private readonly tutorProfileService: TutorProfileService) {}

  @Post('profile')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTutorProfileDto,
  ): Promise<{ data: PublicTutorProfileDto }> {
    const data = await this.tutorProfileService.create(user.id, dto);
    return { data };
  }

  @Get('profile')
  async getOwn(@CurrentUser() user: AuthenticatedUser): Promise<{ data: PublicTutorProfileDto }> {
    const data = await this.tutorProfileService.getOwn(user.id);
    return { data };
  }

  @Patch('profile')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateTutorProfileDto,
  ): Promise<{ data: PublicTutorProfileDto }> {
    const data = await this.tutorProfileService.update(user.id, dto);
    return { data };
  }

  @Put('subjects')
  async replaceSubjects(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReplaceSubjectsDto,
  ): Promise<{ data: PublicTutorProfileDto }> {
    const data = await this.tutorProfileService.replaceSubjects(user.id, dto);
    return { data };
  }

  @Put('grades')
  async replaceGrades(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReplaceGradesDto,
  ): Promise<{ data: PublicTutorProfileDto }> {
    const data = await this.tutorProfileService.replaceGrades(user.id, dto);
    return { data };
  }

  @Put('curricula')
  async replaceCurricula(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReplaceCurriculaDto,
  ): Promise<{ data: PublicTutorProfileDto }> {
    const data = await this.tutorProfileService.replaceCurricula(user.id, dto);
    return { data };
  }

  @Put('locations')
  async replaceLocations(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReplaceLocationsDto,
  ): Promise<{ data: PublicTutorProfileDto }> {
    const data = await this.tutorProfileService.replaceLocations(user.id, dto);
    return { data };
  }

  @Put('availability')
  async replaceAvailability(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReplaceAvailabilityDto,
  ): Promise<{ data: PublicTutorProfileDto }> {
    const data = await this.tutorProfileService.replaceAvailability(user.id, dto);
    return { data };
  }
}
