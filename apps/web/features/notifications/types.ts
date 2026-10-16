export type NotificationType =
  | 'APPLICATION_RECEIVED'
  | 'APPLICATION_UPDATED'
  | 'CONTACT_REQUESTED'
  | 'MESSAGE_RECEIVED'
  | 'VERIFICATION_UPDATED'
  | 'LISTING_UPDATED'
  | 'SECURITY_ALERT'
  | 'REPORT_UPDATED'
  | 'SYSTEM';

export interface Notification {
  id: string;
  type: NotificationType;
  payload: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}
