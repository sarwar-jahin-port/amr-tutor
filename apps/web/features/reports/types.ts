export type ReportCategory =
  | 'FAKE_IDENTITY'
  | 'FALSE_CREDENTIALS'
  | 'MISLEADING_LISTING'
  | 'HARASSMENT'
  | 'SCAM'
  | 'PRIVACY_VIOLATION'
  | 'SPAM'
  | 'UNSAFE_BEHAVIOR'
  | 'OTHER';

export type ReportStatus = 'OPEN' | 'UNDER_REVIEW' | 'ACTION_TAKEN' | 'DISMISSED';

export interface ReportTarget {
  type: 'USER' | 'LISTING' | 'APPLICATION';
  id: string;
}

export interface ReportSummary {
  id: string;
  category: ReportCategory;
  description: string | null;
  status: ReportStatus;
  target: ReportTarget;
  createdAt: string;
  resolvedAt: string | null;
}

export interface ReportModerator extends ReportSummary {
  reporter: { id: string; email: string | null };
  resolution: string | null;
  assignedModeratorId: string | null;
}

/** Exactly one of these — matches CreateReportDto on the backend. */
export type ReportTargetInput =
  | { targetUserId: string }
  | { tutorProfileId: string }
  | { listingId: string }
  | { applicationId: string };
