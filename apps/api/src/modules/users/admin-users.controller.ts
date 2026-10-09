import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PaginatedResponse } from '../../common/dto/pagination-query.dto';
import type { SafeUserDto } from '../../common/dto/safe-user.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { AdminUserSearchQueryDto, UpdateUserStatusDto } from './dto/admin-user-search-query.dto';
import { UsersService } from './users.service';

/** Account search and suspension — ADMIN only (TRD §3.2: user-account moderation is an admin, not moderator, power). */
@Controller('admin/users')
@Roles(Role.ADMIN)
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async search(@Query() query: AdminUserSearchQueryDto): Promise<PaginatedResponse<SafeUserDto>> {
    return this.usersService.adminSearch(query);
  }

  @Get(':id')
  async getDetail(@Param('id', ParseUUIDPipe) id: string): Promise<{ data: SafeUserDto }> {
    const data = await this.usersService.adminGetDetail(id);
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
}
