import { Prisma } from "@prisma/client";

import { getPrismaClient } from "../db/postgres";

const userSelect = {
  select: {
    id: true,
    name: true,
    email: true,
    avatar: { select: { id: true, url: true } },
  },
} as const;

const dmInclude = {
  sender: {
    select: { id: true, name: true, avatar: { select: { id: true, url: true } } },
  },
} satisfies Prisma.DirectMessageInclude;

/** Conversations are unordered pairs; we always store the smaller id as user1. */
function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export class ConversationsRepository {
  private get db() {
    return getPrismaClient();
  }

  async findOrCreate(a: string, b: string) {
    const [user1Id, user2Id] = orderedPair(a, b);
    return this.db.conversation.upsert({
      where: { user1Id_user2Id: { user1Id, user2Id } },
      create: { user1Id, user2Id },
      update: {},
      include: { user1: userSelect, user2: userSelect },
    });
  }

  async findById(id: string) {
    return this.db.conversation.findUnique({
      where: { id },
      include: { user1: userSelect, user2: userSelect },
    });
  }

  isParticipant(
    conversation: { user1Id: string; user2Id: string },
    userId: string,
  ): boolean {
    return conversation.user1Id === userId || conversation.user2Id === userId;
  }

  async listForUser(userId: string) {
    const convs = await this.db.conversation.findMany({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
      include: {
        user1: userSelect,
        user2: userSelect,
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
    });

    const unread = await this.db.directMessage.groupBy({
      by: ["conversationId"],
      where: {
        conversation: { OR: [{ user1Id: userId }, { user2Id: userId }] },
        senderId: { not: userId },
        readAt: null,
      },
      _count: { _all: true },
    });
    const unreadMap = new Map(unread.map((u) => [u.conversationId, u._count._all]));

    return convs.map((c) => ({
      id: c.id,
      other: c.user1Id === userId ? c.user2 : c.user1,
      lastMessage: c.messages[0] ?? null,
      unread: unreadMap.get(c.id) ?? 0,
      updatedAt: c.updatedAt,
    }));
  }

  /**
   * History per chat.md: messages I sent, plus messages I received and have
   * already read. `page` is a negative integer paging backwards from the end.
   */
  async findMessages(conversationId: string, userId: string, page: number, limit: number) {
    const where: Prisma.DirectMessageWhereInput = {
      conversationId,
      OR: [
        { senderId: userId },
        { senderId: { not: userId }, readAt: { not: null } },
      ],
    };

    const total = await this.db.directMessage.count({ where });
    const skipRaw = total + page * limit;
    const skip = Math.max(0, skipRaw);
    const take = skipRaw < 0 ? Math.max(0, limit + skipRaw) : limit;

    const messages =
      take === 0
        ? []
        : await this.db.directMessage.findMany({
            where,
            orderBy: { createdAt: "asc" },
            skip,
            take,
            include: dmInclude,
          });

    return { messages, page, hasMore: skip > 0 };
  }

  async createMessage(conversationId: string, senderId: string, content: string) {
    const [message] = await this.db.$transaction([
      this.db.directMessage.create({
        data: { conversationId, senderId, content },
        include: dmInclude,
      }),
      this.db.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);
    return message;
  }

  async markRead(conversationId: string, readerId: string): Promise<string[]> {
    const unread = await this.db.directMessage.findMany({
      where: { conversationId, senderId: { not: readerId }, readAt: null },
      select: { id: true },
    });
    if (unread.length === 0) return [];
    const ids = unread.map((m) => m.id);
    await this.db.directMessage.updateMany({
      where: { id: { in: ids } },
      data: { readAt: new Date() },
    });
    return ids;
  }

  async findUnreadForUser(userId: string) {
    return this.db.directMessage.findMany({
      where: {
        senderId: { not: userId },
        readAt: null,
        conversation: { OR: [{ user1Id: userId }, { user2Id: userId }] },
      },
      include: dmInclude,
      orderBy: { createdAt: "asc" },
    });
  }

  async findClientUser(userId: string) {
    return this.db.user.findFirst({
      where: { id: userId, role: { in: ["student", "teacher", "sub_teacher"] } },
      select: { id: true },
    });
  }
}
