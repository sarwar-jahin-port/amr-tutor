import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PaginatedResponse } from '../../common/dto/pagination-query.dto';
import type { SafeUserDto } from '../../common/dto/safe-user.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { UpdateGuardianProfileDto } from '../guardians/dto/guardian-profile.dto';
import { UpdateTutorProfileDto } from '../tutors/dto/update-tutor-profile.dto';
import { AdminUserDetailService } from './admin-user-detail.service';
import { AdminChangeRoleDto } from './dto/admin-change-role.dto';
import { AdminUserSearchQueryDto, UpdateUserStatusDto } from './dto/admin-user-search-query.dto';
import { CreateAdminNoteDto, type AdminNoteDto } from './dto/admin-note.dto';
import type { AdminUserDetailDto } from './dto/admin-user-detail.dto';
import { UsersService } from './users.service';

/** Account search, suspension, and detail management — ADMIN only (TRD §3.2: user-account moderation is an admin, not moderator, power). */
@Controller('admin/users')
@Roles(Role.ADMIN)
export class AdminUsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly detailService: AdminUserDetailService,
  ) {}

  @Get()
  async search(@Query() query: AdminUserSearchQueryDto): Promise<PaginatedResponse<SafeUserDto>> {
    return this.usersService.adminSearch(query);
  }

  @Get(':id')
  async getDetail(@Param('id', ParseUUIDPipe) id: string): Promise<{ data: AdminUserDetailDto }> {
    const data = await this.detailService.getDetail(id);
    return { data };
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
  ): Promise<{ data: SafeUserDto }> {
    const data = await this.usersService.adminUpdateStatus(user.id, id, dto);
    return { data };
  }

  @Patch(':id/roles')
  async changeRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminChangeRoleDto,
  ): Promise<{ data: AdminUserDetailDto }> {
    const data = await this.detailService.changeRole(user.id, id, dto);
    return { data };
  }

  @Post(':id/revoke-sessions')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeSessions(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.detailService.revokeSessions(user.id, id);
  }

  @Post(':id/impersonate')
  async impersonate(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    const data = await this.detailService.impersonate(user.id, id);
    return { data };
  }

  @Patch(':id/tutor-profile')
  async updateTutorProfile(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTutorProfileDto) {
    const data = await this.detailService.updateTutorProfile(id, dto);
    return { data };
  }

  @Patch(':id/guardian-profile')
  async updateGuardianProfile(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateGuardianProfileDto) {
    const data = await this.detailService.updateGuardianProfile(id, dto);
    return { data };
  }

  @Post(':id/notes')
  async addNote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateAdminNoteDto,
  ): Promise<{ data: AdminNoteDto }> {
    const data = await this.detailService.addNote(user.id, id, dto);
    return { data };
  }
}
