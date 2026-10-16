import type { ReportCategory, ReportStatus } from './types';

export const REPORT_CATEGORY_LABEL: Record<ReportCategory, string> = {
  FAKE_IDENTITY: 'Fake identity',
  FALSE_CREDENTIALS: 'False credentials',
  MISLEADING_LISTING: 'Misleading listing',
  HARASSMENT: 'Harassment',
  SCAM: 'Scam',
  PRIVACY_VIOLATION: 'Privacy violation',
  SPAM: 'Spam',
  UNSAFE_BEHAVIOR: 'Unsafe behavior',
  OTHER: 'Other',
};

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  OPEN: 'Open',
  UNDER_REVIEW: 'Under review',
  ACTION_TAKEN: 'Action taken',
  DISMISSED: 'Dismissed',
};

export const REPORT_STATUS_BADGE: Record<ReportStatus, 'neutral' | 'success' | 'information' | 'warning' | 'danger'> = {
  OPEN: 'information',
  UNDER_REVIEW: 'warning',
  ACTION_TAKEN: 'success',
  DISMISSED: 'neutral',
};
