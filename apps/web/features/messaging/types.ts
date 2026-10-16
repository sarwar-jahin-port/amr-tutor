export type ConversationStatus = 'ACTIVE' | 'ARCHIVED' | 'RESTRICTED';

export interface ConversationSummary {
  id: string;
  applicationId: string;
  status: ConversationStatus;
  listing: { id: string; title: string };
  counterpart: { userId: string; displayName: string };
  lastMessage: { body: string; senderUserId: string; createdAt: string } | null;
  hasUnread: boolean;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderUserId: string;
  body: string;
  createdAt: string;
}

export interface MessagePage {
  data: Message[];
  meta: { nextCursor: string | null };
}
