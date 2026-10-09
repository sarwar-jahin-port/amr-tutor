export interface AdminUser {
  id: string;
  email: string | null;
  phone: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_DELETION' | 'DELETED';
  roles: string[];
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actor: { id: string; email: string | null } | null;
  action: string;
  targetType: string;
  targetId: string | null;
  outcome: string;
  metadata: unknown;
  createdAt: string;
}
