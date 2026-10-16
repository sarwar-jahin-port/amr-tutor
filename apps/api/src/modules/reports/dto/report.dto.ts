import type { ReportCategory, ReportStatus } from '@prisma/client';

export type ReportTargetType = 'USER' | 'LISTING' | 'APPLICATION';

export interface ReportTarget {
  type: ReportTargetType;
  id: string;
}

/** The reporter's own view — never resolution notes or who's handling it (blueprint Phase 11: "never exposed to ordinary users"). */
export interface ReportSummaryDto {
  id: string;
  category: ReportCategory;
  description: string | null;
  status: ReportStatus;
  target: ReportTarget;
  createdAt: Date;
  resolvedAt: Date | null;
}

/** The moderator queue's view — adds the reporter's identity and the resolution/assignment trail. */
export interface ReportModeratorDto extends ReportSummaryDto {
  reporter: { id: string; email: string | null };
  resolution: string | null;
  assignedModeratorId: string | null;
}

interface ReportRow {
  id: string;
  category: ReportCategory;
  description: string | null;
  status: ReportStatus;
  targetUserId: string | null;
  listingId: string | null;
  applicationId: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
  resolution: string | null;
  assignedModeratorId: string | null;
  reporter: { id: string; email: string | null };
}

function toTarget(row: ReportRow): ReportTarget {
  if (row.listingId) return { type: 'LISTING', id: row.listingId };
  if (row.applicationId) return { type: 'APPLICATION', id: row.applicationId };
  return { type: 'USER', id: row.targetUserId as string };
}

export function toReportSummaryDto(row: ReportRow): ReportSummaryDto {
  return {
    id: row.id,
    category: row.category,
    description: row.description,
    status: row.status,
    target: toTarget(row),
    createdAt: row.createdAt,
    resolvedAt: row.resolvedAt,
  };
}

export function toReportModeratorDto(row: ReportRow): ReportModeratorDto {
  return {
    ...toReportSummaryDto(row),
    reporter: row.reporter,
    resolution: row.resolution,
    assignedModeratorId: row.assignedModeratorId,
  };
}
