import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common';
import type { SafeUserDto } from '../../common/dto/safe-user.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { AddRoleDto } from './dto/add-role.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me')
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateMeDto,
  ): Promise<{ data: SafeUserDto }> {
    const updated = await this.usersService.updateMe(user.id, dto);
    return { data: updated };
  }

  @Post('me/roles')
  async addRole(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddRoleDto,
  ): Promise<{ data: SafeUserDto }> {
    const updated = await this.usersService.addRole(user.id, dto.role);
    return { data: updated };
  }

  @Delete('me/roles/:role')
  async removeRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('role') role: string,
  ): Promise<{ data: SafeUserDto }> {
    const updated = await this.usersService.removeRole(user.id, role);
    return { data: updated };
  }
}
