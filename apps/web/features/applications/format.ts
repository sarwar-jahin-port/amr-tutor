import type { ApplicationStatus } from './types';

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  SUBMITTED: 'Submitted',
  VIEWED: 'Viewed',
  SHORTLISTED: 'Shortlisted',
  CONTACT_REQUESTED: 'Contact requested',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  WITHDRAWN: 'Withdrawn',
  CLOSED: 'Closed',
};

export const APPLICATION_STATUS_BADGE: Record<
  ApplicationStatus,
  'neutral' | 'success' | 'information' | 'warning' | 'danger'
> = {
  SUBMITTED: 'information',
  VIEWED: 'information',
  SHORTLISTED: 'warning',
  CONTACT_REQUESTED: 'warning',
  ACCEPTED: 'success',
  DECLINED: 'danger',
  WITHDRAWN: 'neutral',
  CLOSED: 'neutral',
};
