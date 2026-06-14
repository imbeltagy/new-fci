import type { Express } from "express";
import { Role, RoomType } from "@prisma/client";

import { FilesService } from "../files/files.service";
import { getIO } from "../lib/socket";
import { roomChannel } from "../socket/types";
import type { CreateRoomDto } from "./dto/request/create-room.dto";
import { RoomsRepository } from "./rooms.repository";

const err = (message: string, status: number) =>
  Object.assign(new Error(message), { status });

const isStaffRole = (role: string) => role === Role.teacher || role === Role.sub_teacher;

type RawPost = NonNullable<Awaited<ReturnType<RoomsRepository["findPostWithMeta"]>>>;
type RawComment = Awaited<ReturnType<RoomsRepository["createComment"]>>;
type RawCommentList = Awaited<ReturnType<RoomsRepository["findCommentsForPost"]>>[number];

function emit(roomId: string, event: string, payload: unknown) {
  try {
    getIO().to(roomChannel(roomId)).emit(event, payload);
  } catch {
    /* socket optional */
  }
}

export class RoomsService {
  constructor(
    private readonly repo = new RoomsRepository(),
    private readonly filesService = new FilesService(),
  ) {}

  private mapPost(p: RawPost) {
    return {
      id: p.id,
      roomId: p.roomId,
      content: p.content,
      createdAt: p.createdAt,
      author: {
        id: p.author.id,
        name: p.author.name,
        email: p.author.email,
        role: p.author.role,
        avatarUrl: p.author.avatar?.url ?? null,
      },
      imageUrl: p.image?.url ?? null,
      likeCount: p.likeCount,
      likedByMe: p.likes.length > 0,
      commentCount: p.commentCount,
      isStaff: isStaffRole(p.author.role),
      isPinned: !!p.pinned,
    };
  }

  private mapComment(c: RawCommentList) {
    if (c.deletedAt) {
      return {
        id: c.id,
        postId: c.postId,
        parentId: c.parentId,
        deleted: true,
        content: null,
        createdAt: c.createdAt,
        author: null,
      };
    }
    return {
      id: c.id,
      postId: c.postId,
      parentId: c.parentId,
      deleted: false,
      content: c.content,
      createdAt: c.createdAt,
      author: {
        id: c.author.id,
        name: c.author.name,
        email: c.author.email,
        role: c.author.role,
        avatarUrl: c.author.avatar?.url ?? null,
        isStaff: isStaffRole(c.author.role),
      },
    };
  }

  private async assertMember(roomId: string, userId: string, role: Role) {
    if (!(await this.repo.isMember(userId, role, roomId))) {
      throw err("You are not a member of this room", 403);
    }
  }

  private async assertNotMuted(roomId: string, userId: string) {
    const mute = await this.repo.findMute(roomId, userId);
    if (mute && (!mute.mutedUntil || mute.mutedUntil > new Date())) {
      throw err("You are muted in this room", 403);
    }
  }

  // ── Rooms ─────────────────────────────────────────────────────────────────

  async listMyRooms(userId: string, role: Role) {
    return this.repo.findMyRooms(userId, role);
  }

  async listAllRooms() {
    return this.repo.findAll();
  }

  async getRoom(roomId: string, userId: string, role: Role, isAdmin: boolean) {
    const room = await this.repo.findById(roomId);
    if (!room) throw err("Room not found", 404);
    if (!isAdmin) await this.assertMember(roomId, userId, role);
    return room;
  }

  async createRoom(dto: CreateRoomDto) {
    if (dto.type === RoomType.community) {
      if (!dto.joinYearId) throw err("joinYearId is required for a community", 400);
      const existing = await this.repo.findExisting(dto.type, dto.joinYearId, null, null);
      if (existing) throw err("A community for this join year already exists", 409);
      return this.repo.create({ name: dto.name, type: dto.type, joinYearId: dto.joinYearId });
    }
    if (dto.type === RoomType.major_channel) {
      if (!dto.joinYearId || !dto.majorId) {
        throw err("majorId and joinYearId are required for a major channel", 400);
      }
      const existing = await this.repo.findExisting(dto.type, dto.joinYearId, dto.majorId, null);
      if (existing) throw err("A channel for this major and join year already exists", 409);
      return this.repo.create({
        name: dto.name,
        type: dto.type,
        joinYearId: dto.joinYearId,
        majorId: dto.majorId,
      });
    }
    if (!dto.subjectId) throw err("subjectId is required for a subject channel", 400);
    const existing = await this.repo.findExisting(dto.type, null, null, dto.subjectId);
    if (existing) throw err("A channel for this subject already exists", 409);
    return this.repo.create({ name: dto.name, type: dto.type, subjectId: dto.subjectId });
  }

  async deleteRoom(roomId: string) {
    const room = await this.repo.findById(roomId);
    if (!room) throw err("Room not found", 404);
    await this.repo.delete(roomId);
  }

  // ── Feed ──────────────────────────────────────────────────────────────────

  async listPosts(
    roomId: string,
    userId: string,
    role: Role,
    isAdmin: boolean,
    before: string | undefined,
    limit: number,
  ) {
    const room = await this.repo.findById(roomId);
    if (!room) throw err("Room not found", 404);
    if (!isAdmin) await this.assertMember(roomId, userId, role);

    const { posts, hasMore, nextCursor } = await this.repo.findPosts(roomId, userId, before, limit);
    return { posts: posts.map((p) => this.mapPost(p)), hasMore, nextCursor };
  }

  async getPost(roomId: string, postId: string, userId: string, role: Role, isAdmin: boolean) {
    const meta = await this.repo.findPostById(postId);
    if (!meta || meta.roomId !== roomId || meta.deletedAt) throw err("Post not found", 404);
    if (!isAdmin) await this.assertMember(roomId, userId, role);
    const full = await this.repo.findPostWithMeta(postId, userId);
    return this.mapPost(full!);
  }

  async createPost(
    roomId: string,
    authorId: string,
    role: Role,
    content: string,
    file?: Express.Multer.File,
  ) {
    const room = await this.repo.findById(roomId);
    if (!room) throw err("Room not found", 404);
    await this.assertMember(roomId, authorId, role);
    await this.assertNotMuted(roomId, authorId);

    const text = content.trim();
    if (!text && !file) throw err("A post needs text or an image", 400);

    let imageId: string | null = null;
    if (file) {
      const uploaded = await this.filesService.upload(
        file.buffer,
        file.originalname,
        file.mimetype,
        file.size,
      );
      imageId = uploaded.id;
    }

    const created = await this.repo.createPost(roomId, authorId, text, imageId);
    const full = await this.repo.findPostWithMeta(created.id, authorId);
    const mapped = this.mapPost(full!);

    emit(roomId, "post:new", mapped);
    return mapped;
  }

  async deletePost(roomId: string, postId: string, userId: string, role: Role, isAdmin: boolean) {
    const post = await this.repo.findPostById(postId);
    if (!post || post.roomId !== roomId || post.deletedAt) throw err("Post not found", 404);
    if (!isAdmin && post.authorId !== userId) throw err("Forbidden", 403);

    await this.repo.softDeletePost(postId);
    if (post.imageId) await this.filesService.softDelete(post.imageId);

    emit(roomId, "post:deleted", { postId });
  }

  // ── Likes ─────────────────────────────────────────────────────────────────

  async likePost(roomId: string, postId: string, userId: string, role: Role) {
    const post = await this.repo.findPostById(postId);
    if (!post || post.roomId !== roomId || post.deletedAt) throw err("Post not found", 404);
    await this.assertMember(roomId, userId, role);
    await this.assertNotMuted(roomId, userId);

    const likeCount = await this.repo.like(postId, userId);
    emit(roomId, "post:like", { postId, likeCount });
    return { likeCount, likedByMe: true };
  }

  async unlikePost(roomId: string, postId: string, userId: string, role: Role) {
    const post = await this.repo.findPostById(postId);
    if (!post || post.roomId !== roomId || post.deletedAt) throw err("Post not found", 404);
    await this.assertMember(roomId, userId, role);

    const likeCount = await this.repo.unlike(postId, userId);
    emit(roomId, "post:like", { postId, likeCount });
    return { likeCount, likedByMe: false };
  }

  // ── Comments ──────────────────────────────────────────────────────────────

  async getComments(roomId: string, postId: string, userId: string, role: Role, isAdmin: boolean) {
    const post = await this.repo.findPostById(postId);
    if (!post || post.roomId !== roomId || post.deletedAt) throw err("Post not found", 404);
    if (!isAdmin) await this.assertMember(roomId, userId, role);

    const comments = await this.repo.findCommentsForPost(postId);

    // Keep non-deleted comments and the ancestor chain above them; drop deleted
    // leaves so we don't render pointless tombstones.
    const byId = new Map(comments.map((c) => [c.id, c]));
    const keep = new Set<string>();
    for (const c of comments) {
      if (c.deletedAt) continue;
      let cur: RawCommentList | undefined = c;
      while (cur && !keep.has(cur.id)) {
        keep.add(cur.id);
        cur = cur.parentId ? byId.get(cur.parentId) : undefined;
      }
    }

    return comments.filter((c) => keep.has(c.id)).map((c) => this.mapComment(c));
  }

  async createComment(
    roomId: string,
    postId: string,
    authorId: string,
    role: Role,
    content: string,
    parentId: string | null,
  ) {
    const post = await this.repo.findPostById(postId);
    if (!post || post.roomId !== roomId || post.deletedAt) throw err("Post not found", 404);
    await this.assertMember(roomId, authorId, role);
    await this.assertNotMuted(roomId, authorId);

    const text = content.trim();
    if (!text) throw err("Comment cannot be empty", 400);

    if (parentId) {
      const parent = await this.repo.findCommentById(parentId);
      if (!parent || parent.postId !== postId || parent.deletedAt) {
        throw err("The comment you're replying to no longer exists", 404);
      }
    }

    const created = await this.repo.createComment(postId, authorId, text, parentId);
    const commentCount = await this.repo.countComments(postId);
    emit(roomId, "post:comment", { postId, commentCount });

    return this.mapComment(created);
  }

  async deleteComment(
    roomId: string,
    postId: string,
    commentId: string,
    userId: string,
    isAdmin: boolean,
  ) {
    const comment = await this.repo.findCommentById(commentId);
    if (!comment || comment.postId !== postId || comment.deletedAt) {
      throw err("Comment not found", 404);
    }
    if (!isAdmin && comment.authorId !== userId) throw err("Forbidden", 403);

    await this.repo.softDeleteComment(commentId);
    const commentCount = await this.repo.countComments(postId);
    emit(roomId, "post:comment", { postId, commentCount });
  }

  // ── Pins ──────────────────────────────────────────────────────────────────

  async getPins(roomId: string, userId: string, role: Role, isAdmin: boolean) {
    if (!isAdmin) await this.assertMember(roomId, userId, role);
    const pins = await this.repo.findPins(roomId, userId);
    return pins.map((p) => this.mapPost(p));
  }

  async pinPost(roomId: string, postId: string, userId: string, role: Role) {
    if (!isStaffRole(role)) throw err("Only faculty can pin posts", 403);
    await this.assertMember(roomId, userId, role);
    const post = await this.repo.findPostById(postId);
    if (!post || post.roomId !== roomId || post.deletedAt) throw err("Post not found", 404);
    await this.repo.pinPost(roomId, postId, userId);
  }

  async unpinPost(roomId: string, postId: string, userId: string, role: Role) {
    if (!isStaffRole(role)) throw err("Only faculty can unpin posts", 403);
    await this.assertMember(roomId, userId, role);
    await this.repo.unpinPost(postId);
  }

  // ── Moderation ────────────────────────────────────────────────────────────

  async listMutes(roomId: string) {
    return this.repo.listMutes(roomId);
  }

  async muteUser(roomId: string, userId: string, mutedUntil: Date | null) {
    return this.repo.muteUser(roomId, userId, mutedUntil);
  }

  async unmuteUser(roomId: string, userId: string) {
    await this.repo.unmuteUser(roomId, userId);
  }
}
