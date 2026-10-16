import type { NotificationType } from '@prisma/client';

/**
 * `payload` carries event-specific ids (applicationId, listingId, ...) only
 * — never contact details or other sensitive content (blueprint Phase 9:
 * "private information is not embedded in public notification payloads").
 * There's no stored title/body column (schema doc §14 keeps Notification
 * generic); the frontend renders copy per `type`, same as it already does
 * for ApplicationStatus/VerificationStatus labels.
 */
export interface NotificationDto {
  id: string;
  type: NotificationType;
  payload: unknown;
  readAt: Date | null;
  createdAt: Date;
}

export function toNotificationDto(row: {
  id: string;
  type: NotificationType;
  payload: unknown;
  readAt: Date | null;
  createdAt: Date;
}): NotificationDto {
  return {
    id: row.id,
    type: row.type,
    payload: row.payload,
    readAt: row.readAt,
    createdAt: row.createdAt,
  };
}
