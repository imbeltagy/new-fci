import { Role, RoomType } from "@prisma/client";

import {
  getRoomUnreadCounts,
  incrRoomMessageCount,
  markRoomRead,
} from "../lib/unread";
import type { CreateRoomDto } from "./dto/request/create-room.dto";
import { RoomsRepository } from "./rooms.repository";

const err = (message: string, status: number) =>
  Object.assign(new Error(message), { status });

type RawMessage = Awaited<ReturnType<RoomsRepository["createMessage"]>>;

export class RoomsService {
  constructor(private readonly repo = new RoomsRepository()) {}

  private mapMessage(m: RawMessage) {
    return {
      id: m.id,
      roomId: m.roomId,
      senderId: m.senderId,
      content: m.content,
      createdAt: m.createdAt,
      sender: {
        id: m.sender.id,
        name: m.sender.name,
        role: m.sender.role,
        avatarUrl: m.sender.avatar?.url ?? null,
      },
      isStaff: m.sender.role === Role.teacher || m.sender.role === Role.sub_teacher,
      isPinned: !!m.pinned,
    };
  }

  // ── Listing ─────────────────────────────────────────────────────────────

  async listMyRooms(userId: string, role: Role) {
    const rooms = await this.repo.findMyRooms(userId, role);
    const unread = await getRoomUnreadCounts(userId, rooms.map((r) => r.id));
    return rooms.map((r) => ({ ...r, unread: unread[r.id] ?? 0 }));
  }

  async listAllRooms() {
    return this.repo.findAll();
  }

  async getRoom(roomId: string, userId: string, role: Role, isAdmin: boolean) {
    const room = await this.repo.findById(roomId);
    if (!room) throw err("Room not found", 404);
    if (!isAdmin && !(await this.repo.isMember(userId, role, roomId))) {
      throw err("You are not a member of this room", 403);
    }
    return room;
  }

  // ── Admin: create / delete ──────────────────────────────────────────────

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

    // subject_channel
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

  // ── Messages ────────────────────────────────────────────────────────────

  async getMessages(
    roomId: string,
    userId: string,
    role: Role,
    isAdmin: boolean,
    before: string | undefined,
    limit: number,
  ) {
    const room = await this.repo.findById(roomId);
    if (!room) throw err("Room not found", 404);
    if (!isAdmin && !(await this.repo.isMember(userId, role, roomId))) {
      throw err("You are not a member of this room", 403);
    }

    const { messages, hasMore, nextCursor } = await this.repo.findMessages(
      roomId,
      before,
      limit,
    );
    if (!isAdmin) await markRoomRead(userId, roomId);

    return { messages: messages.map((m) => this.mapMessage(m)), hasMore, nextCursor };
  }

  /** Used by the socket handler — validates membership and mute, persists, bumps unread. */
  async postMessage(roomId: string, senderId: string, role: Role, content: string) {
    const trimmed = content.trim();
    if (!trimmed) throw err("Message cannot be empty", 400);

    const isMember = await this.repo.isMember(senderId, role, roomId);
    if (!isMember) throw err("You are not a member of this room", 403);

    const mute = await this.repo.findMute(roomId, senderId);
    if (mute && (!mute.mutedUntil || mute.mutedUntil > new Date())) {
      throw err("You are muted in this room", 403);
    }

    const message = await this.repo.createMessage(roomId, senderId, trimmed);
    await incrRoomMessageCount(roomId);
    return this.mapMessage(message);
  }

  async markRead(userId: string, roomId: string) {
    await markRoomRead(userId, roomId);
  }

  // ── Pins ────────────────────────────────────────────────────────────────

  async getPins(roomId: string, userId: string, role: Role, isAdmin: boolean) {
    if (!isAdmin && !(await this.repo.isMember(userId, role, roomId))) {
      throw err("You are not a member of this room", 403);
    }
    const pins = await this.repo.findPins(roomId);
    return pins.map((m) => this.mapMessage(m));
  }

  async pinMessage(roomId: string, messageId: string, userId: string, role: Role) {
    if (role !== Role.teacher && role !== Role.sub_teacher) {
      throw err("Only faculty can pin messages", 403);
    }
    if (!(await this.repo.isMember(userId, role, roomId))) {
      throw err("You are not a member of this room", 403);
    }
    const message = await this.repo.findMessageById(messageId);
    if (!message || message.roomId !== roomId) throw err("Message not found", 404);
    await this.repo.pinMessage(roomId, messageId, userId);
  }

  async unpinMessage(roomId: string, messageId: string, userId: string, role: Role) {
    if (role !== Role.teacher && role !== Role.sub_teacher) {
      throw err("Only faculty can unpin messages", 403);
    }
    if (!(await this.repo.isMember(userId, role, roomId))) {
      throw err("You are not a member of this room", 403);
    }
    await this.repo.unpinMessage(messageId);
  }

  // ── Moderation (admin) ──────────────────────────────────────────────────

  async deleteMessage(roomId: string, messageId: string) {
    const message = await this.repo.findMessageById(messageId);
    if (!message || message.roomId !== roomId) throw err("Message not found", 404);
    await this.repo.softDeleteMessage(messageId);
  }

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
