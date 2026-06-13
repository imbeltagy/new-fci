import type { UserRole } from "./user";

export interface RoomMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: UserRole;
    avatarUrl: string | null;
  };
  isStaff: boolean;
  isPinned: boolean;
}

export interface RoomMessagesPage {
  messages: RoomMessage[];
  hasMore: boolean;
  nextCursor: string | null;
}
