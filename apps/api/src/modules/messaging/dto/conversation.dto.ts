import type { ConversationStatus } from '@prisma/client';

export interface MessageDto {
  id: string;
  conversationId: string;
  senderUserId: string;
  body: string;
  createdAt: Date;
}

export interface ConversationSummaryDto {
  id: string;
  applicationId: string;
  status: ConversationStatus;
  listing: { id: string; title: string };
  /** The other participant — never the caller themself. */
  counterpart: { userId: string; displayName: string };
  lastMessage: { body: string; senderUserId: string; createdAt: Date } | null;
  hasUnread: boolean;
  updatedAt: Date;
}

interface ConversationRow {
  id: string;
  applicationId: string;
  status: ConversationStatus;
  updatedAt: Date;
  application: {
    listing: {
      id: string;
      title: string;
      guardianUserId: string;
      guardianUser: { guardianProfile: { displayName: string } | null };
    };
    tutorProfile: { userId: string; fullName: string };
  };
  messages: { body: string; senderUserId: string; createdAt: Date }[];
}

export function toConversationSummaryDto(
  row: ConversationRow,
  viewerUserId: string,
  hasUnread: boolean,
): ConversationSummaryDto {
  const { listing, tutorProfile } = row.application;
  const viewerIsTutor = viewerUserId === tutorProfile.userId;

  const counterpart = viewerIsTutor
    ? { userId: listing.guardianUserId, displayName: listing.guardianUser.guardianProfile?.displayName ?? 'Guardian' }
    : { userId: tutorProfile.userId, displayName: tutorProfile.fullName };

  const lastMessage = row.messages[0] ?? null;

  return {
    id: row.id,
    applicationId: row.applicationId,
    status: row.status,
    listing: { id: listing.id, title: listing.title },
    counterpart,
    lastMessage: lastMessage
      ? { body: lastMessage.body, senderUserId: lastMessage.senderUserId, createdAt: lastMessage.createdAt }
      : null,
    hasUnread,
    updatedAt: row.updatedAt,
  };
}

export function toMessageDto(row: {
  id: string;
  conversationId: string;
  senderUserId: string;
  body: string;
  createdAt: Date;
}): MessageDto {
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderUserId: row.senderUserId,
    body: row.body,
    createdAt: row.createdAt,
  };
}
