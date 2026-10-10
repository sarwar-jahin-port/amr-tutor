import { Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { PaginatedResponse, PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { NotificationDto } from './dto/notification.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<NotificationDto>> {
    return this.notificationsService.list(user.id, query);
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: AuthenticatedUser): Promise<{ data: { count: number } }> {
    const count = await this.notificationsService.unreadCount(user.id);
    return { data: { count } };
  }

  @Patch(':id/read')
  async markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ data: { ok: true } }> {
    await this.notificationsService.markRead(user.id, id);
    return { data: { ok: true } };
  }

  @Patch('read-all')
  async markAllRead(@CurrentUser() user: AuthenticatedUser): Promise<{ data: { ok: true } }> {
    await this.notificationsService.markAllRead(user.id);
    return { data: { ok: true } };
  }
}
