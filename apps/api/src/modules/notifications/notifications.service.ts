import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { NotificationType, Prisma } from '@prisma/client';
import { PaginatedResponse, PaginationQueryDto, paginate } from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../database/prisma.service';
import { NotificationDto, toNotificationDto } from './dto/notification.dto';

// Only *read* notifications age out — an unread one stays until the user
// has actually seen it, however old it gets (no row count or age makes it
// safe to silently drop something nobody has acknowledged yet).
const READ_RETENTION_DAYS = 30;

/**
 * The shared notification service blueprint Phase 11 calls for ("so
 * different modules do not invent inconsistent notification behavior").
 * `create` has existed since Phase 8/9; this adds the read side — list,
 * unread count, and marking read — now that Phase 11 gives users somewhere
 * to actually see them.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, type: NotificationType, payload: Record<string, unknown>): Promise<void> {
    await this.prisma.notification.create({
      data: { userId, type, payload: payload as Prisma.InputJsonValue },
    });
  }

  async list(userId: string, query: PaginationQueryDto): Promise<PaginatedResponse<NotificationDto>> {
    const where = { userId };

    const [rows, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return paginate(rows.map(toNotificationDto), query.page, query.limit, total);
  }

  async unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  async markRead(userId: string, notificationId: string): Promise<void> {
    const result = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId, readAt: null },
      data: { readAt: new Date() },
    });
    // Idempotent: a notification that's already read, or doesn't belong to
    // this user, both match zero rows — only the latter is actually wrong,
    // but there's no way to tell them apart without leaking existence, so
    // this mirrors the ownership-check 404 pattern used elsewhere.
    if (result.count === 0) {
      const exists = await this.prisma.notification.findFirst({ where: { id: notificationId, userId } });
      if (!exists) {
        throw new NotFoundException('Notification not found.');
      }
    }
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  /** Daily sweep: drop read notifications once they're older than the retention window. Unread ones are never touched. */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async purgeOldReadNotifications(): Promise<void> {
    const cutoff = new Date(Date.now() - READ_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const { count } = await this.prisma.notification.deleteMany({
      where: { readAt: { not: null }, createdAt: { lt: cutoff } },
    });
    if (count > 0) {
      this.logger.log(`Purged ${count} read notification(s) older than ${READ_RETENTION_DAYS} days.`);
    }
  }
}
