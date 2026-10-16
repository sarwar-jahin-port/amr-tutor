export interface AuditLogEntryDto {
  id: string;
  actor: { id: string; email: string | null } | null;
  action: string;
  targetType: string;
  targetId: string | null;
  outcome: string;
  metadata: unknown;
  createdAt: Date;
}

interface AuditLogRow {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  outcome: string;
  metadata: unknown;
  createdAt: Date;
  actor: { id: string; email: string | null } | null;
}

export function toAuditLogEntryDto(row: AuditLogRow): AuditLogEntryDto {
  return {
    id: row.id,
    actor: row.actor,
    action: row.action,
    targetType: row.targetType,
    targetId: row.targetId,
    outcome: row.outcome,
    metadata: row.metadata,
    createdAt: row.createdAt,
  };
}
