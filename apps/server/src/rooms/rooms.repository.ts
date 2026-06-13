import { Prisma, Role, RoomType } from "@prisma/client";

import { getPrismaClient } from "../db/postgres";

const fileSelect = { select: { id: true, url: true } } as const;

const messageInclude = {
  sender: {
    select: { id: true, name: true, role: true, avatar: fileSelect },
  },
  pinned: { select: { id: true } },
} satisfies Prisma.MessageInclude;

export interface MembershipContext {
  joinYearIds: string[];
  majorPairs: { majorId: string; joinYearId: string }[];
  subjectIds: string[];
}

export class RoomsRepository {
  private get db() {
    return getPrismaClient();
  }

  // ── Membership ────────────────────────────────────────────────────────────

  /** The groupings that determine which rooms a user belongs to. */
  async getMembershipContext(userId: string, role: Role): Promise<MembershipContext> {
    if (role === Role.student) {
      const user = await this.db.user.findUnique({
        where: { id: userId },
        select: {
          joinYearId: true,
          majorId: true,
          subjectEnrollments: { select: { subjectId: true } },
        },
      });
      if (!user) return { joinYearIds: [], majorPairs: [], subjectIds: [] };
      return {
        joinYearIds: user.joinYearId ? [user.joinYearId] : [],
        majorPairs:
          user.joinYearId && user.majorId
            ? [{ majorId: user.majorId, joinYearId: user.joinYearId }]
            : [],
        subjectIds: user.subjectEnrollments.map((e) => e.subjectId),
      };
    }

    // teacher / sub_teacher
    const [joinYears, majors, subjects] = await Promise.all([
      this.db.staffJoinYearAssignment.findMany({
        where: { userId },
        select: { joinYearId: true },
      }),
      this.db.staffMajorAssignment.findMany({
        where: { userId },
        select: { majorId: true, joinYearId: true },
      }),
      this.db.staffSubjectAssignment.findMany({
        where: { userId },
        select: { subjectId: true },
      }),
    ]);

    return {
      joinYearIds: joinYears.map((a) => a.joinYearId),
      majorPairs: majors.map((a) => ({ majorId: a.majorId, joinYearId: a.joinYearId })),
      subjectIds: subjects.map((a) => a.subjectId),
    };
  }

  private membershipWhere(ctx: MembershipContext): Prisma.RoomWhereInput {
    const or: Prisma.RoomWhereInput[] = [];
    if (ctx.joinYearIds.length) {
      or.push({ type: RoomType.community, joinYearId: { in: ctx.joinYearIds } });
    }
    if (ctx.majorPairs.length) {
      or.push({
        type: RoomType.major_channel,
        OR: ctx.majorPairs.map((p) => ({ majorId: p.majorId, joinYearId: p.joinYearId })),
      });
    }
    if (ctx.subjectIds.length) {
      or.push({ type: RoomType.subject_channel, subjectId: { in: ctx.subjectIds } });
    }
    // No memberships → match nothing.
    return or.length ? { OR: or } : { id: "__none__" };
  }

  async findMyRooms(userId: string, role: Role) {
    const ctx = await this.getMembershipContext(userId, role);
    return this.db.room.findMany({
      where: this.membershipWhere(ctx),
      include: this.roomRelations(),
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
  }

  async isMember(userId: string, role: Role, roomId: string): Promise<boolean> {
    const ctx = await this.getMembershipContext(userId, role);
    const match = await this.db.room.findFirst({
      where: { AND: [{ id: roomId }, this.membershipWhere(ctx)] },
      select: { id: true },
    });
    return !!match;
  }

  // ── Rooms ─────────────────────────────────────────────────────────────────

  private roomRelations() {
    return {
      joinYear: { select: { id: true, year: true } },
      major: { select: { id: true, name: true, code: true } },
      subject: { select: { id: true, name: true, code: true } },
    } satisfies Prisma.RoomInclude;
  }

  async findAll() {
    return this.db.room.findMany({
      include: this.roomRelations(),
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
  }

  async findById(id: string) {
    return this.db.room.findUnique({
      where: { id },
      include: this.roomRelations(),
    });
  }

  async create(data: {
    name: string;
    type: RoomType;
    joinYearId?: string | null;
    majorId?: string | null;
    subjectId?: string | null;
  }) {
    return this.db.room.create({
      data: {
        name: data.name,
        type: data.type,
        joinYearId: data.joinYearId ?? null,
        majorId: data.majorId ?? null,
        subjectId: data.subjectId ?? null,
      },
      include: this.roomRelations(),
    });
  }

  async delete(id: string) {
    await this.db.room.delete({ where: { id } });
  }

  async findExisting(type: RoomType, joinYearId: string | null, majorId: string | null, subjectId: string | null) {
    if (type === RoomType.subject_channel) {
      return this.db.room.findUnique({ where: { subjectId: subjectId ?? undefined } });
    }
    return this.db.room.findFirst({ where: { type, joinYearId, majorId } });
  }

  // ── Messages ──────────────────────────────────────────────────────────────

  async findMessages(roomId: string, before: string | undefined, limit: number) {
    let cursorDate: Date | undefined;
    if (before) {
      const cursor = await this.db.message.findUnique({
        where: { id: before },
        select: { createdAt: true },
      });
      cursorDate = cursor?.createdAt;
    }

    const rows = await this.db.message.findMany({
      where: {
        roomId,
        deletedAt: null,
        ...(cursorDate && { createdAt: { lt: cursorDate } }),
      },
      include: messageInclude,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);
    const nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null;

    return { messages: page.reverse(), hasMore, nextCursor };
  }

  async findMessageById(id: string) {
    return this.db.message.findUnique({ where: { id }, include: messageInclude });
  }

  async createMessage(roomId: string, senderId: string, content: string) {
    return this.db.message.create({
      data: { roomId, senderId, content },
      include: messageInclude,
    });
  }

  async softDeleteMessage(id: string) {
    await this.db.message.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ── Pins ──────────────────────────────────────────────────────────────────

  async findPins(roomId: string) {
    const pins = await this.db.pinnedMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: "desc" },
      include: { message: { include: messageInclude } },
    });
    return pins.map((p) => p.message);
  }

  async pinMessage(roomId: string, messageId: string, pinnedById: string) {
    return this.db.pinnedMessage.upsert({
      where: { messageId },
      create: { roomId, messageId, pinnedById },
      update: {},
    });
  }

  async unpinMessage(messageId: string) {
    await this.db.pinnedMessage.deleteMany({ where: { messageId } });
  }

  // ── Mutes ─────────────────────────────────────────────────────────────────

  async findMute(roomId: string, userId: string) {
    return this.db.mutedUser.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
  }

  async listMutes(roomId: string) {
    return this.db.mutedUser.findMany({
      where: { roomId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async muteUser(roomId: string, userId: string, mutedUntil: Date | null) {
    return this.db.mutedUser.upsert({
      where: { roomId_userId: { roomId, userId } },
      create: { roomId, userId, mutedUntil },
      update: { mutedUntil },
    });
  }

  async unmuteUser(roomId: string, userId: string) {
    await this.db.mutedUser.deleteMany({ where: { roomId, userId } });
  }
}
