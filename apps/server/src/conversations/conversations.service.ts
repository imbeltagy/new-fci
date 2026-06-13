import { ConversationsRepository } from "./conversations.repository";

const err = (message: string, status: number) =>
  Object.assign(new Error(message), { status });

type RawConversation = NonNullable<
  Awaited<ReturnType<ConversationsRepository["findById"]>>
>;
type RawDm = Awaited<ReturnType<ConversationsRepository["createMessage"]>>;

export class ConversationsService {
  constructor(private readonly repo = new ConversationsRepository()) {}

  private mapDm(m: RawDm) {
    return {
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      content: m.content,
      createdAt: m.createdAt,
      readAt: m.readAt,
      sender: {
        id: m.sender.id,
        name: m.sender.name,
        avatarUrl: m.sender.avatar?.url ?? null,
      },
    };
  }

  private otherParticipant(conv: RawConversation, userId: string) {
    return conv.user1Id === userId ? conv.user2 : conv.user1;
  }

  async listMine(userId: string) {
    const list = await this.repo.listForUser(userId);
    return list.map((c) => ({
      id: c.id,
      other: {
        id: c.other.id,
        name: c.other.name,
        email: c.other.email,
        avatarUrl: c.other.avatar?.url ?? null,
      },
      lastMessage: c.lastMessage
        ? { content: c.lastMessage.content, createdAt: c.lastMessage.createdAt, senderId: c.lastMessage.senderId }
        : null,
      unread: c.unread,
      updatedAt: c.updatedAt,
    }));
  }

  async startConversation(userId: string, targetId: string) {
    if (targetId === userId) throw err("You cannot chat with yourself", 400);
    const target = await this.repo.findClientUser(targetId);
    if (!target) throw err("User not found", 404);

    const conv = await this.repo.findOrCreate(userId, targetId);
    const other = this.otherParticipant(conv, userId);
    return {
      id: conv.id,
      other: { id: other.id, name: other.name, email: other.email, avatarUrl: other.avatar?.url ?? null },
    };
  }

  async getConversation(id: string, userId: string) {
    const conv = await this.repo.findById(id);
    if (!conv) throw err("Conversation not found", 404);
    if (!this.repo.isParticipant(conv, userId)) throw err("Forbidden", 403);
    const other = this.otherParticipant(conv, userId);
    return {
      id: conv.id,
      other: { id: other.id, name: other.name, email: other.email, avatarUrl: other.avatar?.url ?? null },
    };
  }

  async getMessages(id: string, userId: string, page: number, limit: number) {
    const conv = await this.repo.findById(id);
    if (!conv) throw err("Conversation not found", 404);
    if (!this.repo.isParticipant(conv, userId)) throw err("Forbidden", 403);

    // Opening a conversation (most-recent page) marks received messages read, so
    // they enter history as read-received instead of being stuck as live-only.
    if (page === -1) await this.repo.markRead(id, userId);

    const { messages, hasMore } = await this.repo.findMessages(id, userId, page, limit);
    return { messages: messages.map((m) => this.mapDm(m)), page, hasMore };
  }

  /** Used by the socket handler. Returns the saved message and the recipient id. */
  async postMessage(conversationId: string, senderId: string, content: string) {
    const trimmed = content.trim();
    if (!trimmed) throw err("Message cannot be empty", 400);

    const conv = await this.repo.findById(conversationId);
    if (!conv) throw err("Conversation not found", 404);
    if (!this.repo.isParticipant(conv, senderId)) throw err("Forbidden", 403);

    const recipientId = conv.user1Id === senderId ? conv.user2Id : conv.user1Id;
    const raw = await this.repo.createMessage(conversationId, senderId, trimmed);
    return { message: this.mapDm(raw), recipientId };
  }

  async markRead(conversationId: string, readerId: string) {
    const conv = await this.repo.findById(conversationId);
    if (!conv) throw err("Conversation not found", 404);
    if (!this.repo.isParticipant(conv, readerId)) throw err("Forbidden", 403);

    const messageIds = await this.repo.markRead(conversationId, readerId);
    const otherId = conv.user1Id === readerId ? conv.user2Id : conv.user1Id;
    return { messageIds, otherId };
  }

  async getCatchUp(userId: string) {
    const unread = await this.repo.findUnreadForUser(userId);
    return unread.map((m) => this.mapDm(m));
  }
}
