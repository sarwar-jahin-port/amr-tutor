import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

/**
 * The write-path for sensitive administrative actions (blueprint Phase 11:
 * "Administrative actions are audited"). Deliberately narrow — `action`/
 * `targetType`/`outcome` are free-form strings rather than enums so a new
 * admin action never needs a schema migration, matching AuditLog's actual
 * Prisma shape (schema doc §15).
 */
@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: {
    actorUserId: string;
    action: string;
    targetType: string;
    targetId?: string;
    outcome: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorUserId: entry.actorUserId,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        outcome: entry.outcome,
        metadata: entry.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
