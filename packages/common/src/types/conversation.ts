export interface ConversationParticipant {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  sender: { id: string; name: string; avatarUrl: string | null };
}

export interface ConversationListItem {
  id: string;
  other: ConversationParticipant;
  lastMessage: { content: string; createdAt: string; senderId: string } | null;
  unread: number;
  updatedAt: string;
}

export interface ConversationSummary {
  id: string;
  other: ConversationParticipant;
}

export interface DirectMessagesPage {
  messages: DirectMessage[];
  page: number;
  hasMore: boolean;
}

export interface DmReadEvent {
  conversationId: string;
  messageIds: string[];
  readAt: string;
}
