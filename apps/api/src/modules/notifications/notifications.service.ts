import { Injectable } from '@nestjs/common';
import type { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

/**
 * The minimal write-path every module needs (blueprint Phase 8/9: "write a
 * notification on this state change"). This is deliberately not the full
 * "shared notification service" blueprint Phase 11 calls for — no
 * preferences, delivery channels, or read-state management yet — just the
 * one `create` call every module would otherwise duplicate.
 */
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, type: NotificationType, payload: Record<string, unknown>): Promise<void> {
    await this.prisma.notification.create({
      data: { userId, type, payload: payload as Prisma.InputJsonValue },
    });
  }
}
