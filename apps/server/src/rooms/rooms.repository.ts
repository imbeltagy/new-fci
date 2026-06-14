import { Prisma, Role, RoomType } from "@prisma/client";

import { getPrismaClient } from "../db/postgres";

const fileSelect = { select: { id: true, url: true } } as const;

const authorSelect = {
  select: { id: true, name: true, role: true, avatar: fileSelect },
} as const;

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
    return this.db.room.findUnique({ where: { id }, include: this.roomRelations() });
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

  async findExisting(
    type: RoomType,
    joinYearId: string | null,
    majorId: string | null,
    subjectId: string | null,
  ) {
    if (type === RoomType.subject_channel) {
      return this.db.room.findUnique({ where: { subjectId: subjectId ?? undefined } });
    }
    return this.db.room.findFirst({ where: { type, joinYearId, majorId } });
  }

  // ── Posts ─────────────────────────────────────────────────────────────────

  private postInclude(viewerId: string) {
    return {
      author: authorSelect,
      image: fileSelect,
      pinned: { select: { id: true } },
      likes: { where: { userId: viewerId }, select: { id: true }, take: 1 },
    } satisfies Prisma.PostInclude;
  }

  /** Attaches commentCount to a set of posts via a single grouped query. */
  private async withCommentCounts<T extends { id: string }>(
    posts: T[],
  ): Promise<(T & { commentCount: number })[]> {
    if (posts.length === 0) return [];
    const counts = await this.db.comment.groupBy({
      by: ["postId"],
      where: { postId: { in: posts.map((p) => p.id) }, deletedAt: null },
      _count: { _all: true },
    });
    const map = new Map(counts.map((c) => [c.postId, c._count._all]));
    return posts.map((p) => ({ ...p, commentCount: map.get(p.id) ?? 0 }));
  }

  async findPosts(roomId: string, viewerId: string, before: string | undefined, limit: number) {
    let cursorDate: Date | undefined;
    if (before) {
      const cursor = await this.db.post.findUnique({
        where: { id: before },
        select: { createdAt: true },
      });
      cursorDate = cursor?.createdAt;
    }

    const rows = await this.db.post.findMany({
      where: { roomId, deletedAt: null, ...(cursorDate && { createdAt: { lt: cursorDate } }) },
      include: this.postInclude(viewerId),
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);
    const nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null;
    const withCounts = await this.withCommentCounts(page);

    return { posts: withCounts, hasMore, nextCursor };
  }

  async findPostById(id: string) {
    return this.db.post.findUnique({
      where: { id },
      select: { id: true, roomId: true, authorId: true, imageId: true, deletedAt: true },
    });
  }

  /** Full post with viewer-specific meta (used after create / for single fetch). */
  async findPostWithMeta(id: string, viewerId: string) {
    const post = await this.db.post.findUnique({
      where: { id },
      include: this.postInclude(viewerId),
    });
    if (!post) return null;
    const [withCount] = await this.withCommentCounts([post]);
    return withCount;
  }

  async createPost(roomId: string, authorId: string, content: string, imageId: string | null) {
    return this.db.post.create({
      data: { roomId, authorId, content, imageId },
    });
  }

  async softDeletePost(id: string) {
    await this.db.post.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ── Likes (transactional counter) ──────────────────────────────────────────

  async like(postId: string, userId: string): Promise<number> {
    return this.db.$transaction(async (tx) => {
      const res = await tx.postLike.createMany({
        data: { postId, userId },
        skipDuplicates: true,
      });
      if (res.count === 0) {
        const p = await tx.post.findUnique({ where: { id: postId }, select: { likeCount: true } });
        return p?.likeCount ?? 0;
      }
      const updated = await tx.post.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true },
      });
      return updated.likeCount;
    });
  }

  async unlike(postId: string, userId: string): Promise<number> {
    return this.db.$transaction(async (tx) => {
      const res = await tx.postLike.deleteMany({ where: { postId, userId } });
      if (res.count === 0) {
        const p = await tx.post.findUnique({ where: { id: postId }, select: { likeCount: true } });
        return p?.likeCount ?? 0;
      }
      const updated = await tx.post.update({
        where: { id: postId },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true },
      });
      return updated.likeCount;
    });
  }

  // ── Comments (arbitrary tree) ──────────────────────────────────────────────

  async findCommentsForPost(postId: string) {
    return this.db.comment.findMany({
      where: { postId },
      include: { author: authorSelect },
      orderBy: { createdAt: "asc" },
    });
  }

  async findCommentById(id: string) {
    return this.db.comment.findUnique({
      where: { id },
      select: { id: true, postId: true, authorId: true, deletedAt: true },
    });
  }

  async createComment(postId: string, authorId: string, content: string, parentId: string | null) {
    return this.db.comment.create({
      data: { postId, authorId, content, parentId },
      include: { author: authorSelect },
    });
  }

  async softDeleteComment(id: string) {
    await this.db.comment.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async countComments(postId: string): Promise<number> {
    return this.db.comment.count({ where: { postId, deletedAt: null } });
  }

  // ── Pins (post-based) ──────────────────────────────────────────────────────

  async findPins(roomId: string, viewerId: string) {
    const pins = await this.db.pinnedPost.findMany({
      where: { roomId, post: { deletedAt: null } },
      orderBy: { createdAt: "desc" },
      include: { post: { include: this.postInclude(viewerId) } },
    });
    const posts = pins.map((p) => p.post);
    return this.withCommentCounts(posts);
  }

  async pinPost(roomId: string, postId: string, pinnedById: string) {
    return this.db.pinnedPost.upsert({
      where: { postId },
      create: { roomId, postId, pinnedById },
      update: {},
    });
  }

  async unpinPost(postId: string) {
    await this.db.pinnedPost.deleteMany({ where: { postId } });
  }

  // ── Mutes ──────────────────────────────────────────────────────────────────

  async findMute(roomId: string, userId: string) {
    return this.db.mutedUser.findUnique({ where: { roomId_userId: { roomId, userId } } });
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
