"use client";

import { API_ROUTES } from "../constants/api";
import { api } from "../lib/api-client";
import type {
  LikeResult,
  Post,
  PostComment,
  PostsPage,
} from "../types/post";
import type { CreateRoomBody, Room, RoomMute } from "../types/room";

// ── Rooms ───────────────────────────────────────────────────────────────────

export async function listRooms() {
  return api.get<{ rooms: Room[] }>(API_ROUTES.rooms.list);
}

export async function createRoom(body: CreateRoomBody) {
  return api.post<{ room: Room }>(API_ROUTES.rooms.create, body);
}

export async function getRoom(id: string) {
  return api.get<{ room: Room }>(API_ROUTES.rooms.getById(id));
}

export async function deleteRoom(id: string) {
  return api.delete<null>(API_ROUTES.rooms.deleteById(id));
}

// ── Posts ───────────────────────────────────────────────────────────────────

export async function getRoomPosts(
  id: string,
  params?: { before?: string; limit?: number },
) {
  return api.get<PostsPage>(API_ROUTES.rooms.posts(id), {
    queries: {
      ...(params?.before && { before: params.before }),
      ...(params?.limit && { limit: String(params.limit) }),
    },
  });
}

export async function getPost(id: string, postId: string) {
  return api.get<{ post: Post }>(API_ROUTES.rooms.getPost(id, postId));
}

export async function createPost(
  id: string,
  body: { content: string; image?: File },
) {
  const form = new FormData();
  form.append("content", body.content);
  if (body.image instanceof File) form.append("image", body.image);
  return api.post<{ post: Post }>(API_ROUTES.rooms.posts(id), form);
}

export async function deletePost(id: string, postId: string) {
  return api.delete<null>(API_ROUTES.rooms.deletePost(id, postId));
}

export async function likePost(id: string, postId: string) {
  return api.post<LikeResult>(API_ROUTES.rooms.likePost(id, postId), {});
}

export async function unlikePost(id: string, postId: string) {
  return api.delete<LikeResult>(API_ROUTES.rooms.likePost(id, postId));
}

// ── Comments ────────────────────────────────────────────────────────────────

export async function getPostComments(id: string, postId: string) {
  return api.get<{ comments: PostComment[] }>(API_ROUTES.rooms.comments(id, postId));
}

export async function createComment(
  id: string,
  postId: string,
  body: { content: string; parentId?: string },
) {
  return api.post<{ comment: PostComment }>(API_ROUTES.rooms.comments(id, postId), body);
}

export async function deleteComment(id: string, postId: string, commentId: string) {
  return api.delete<null>(API_ROUTES.rooms.deleteComment(id, postId, commentId));
}

// ── Pins ────────────────────────────────────────────────────────────────────

export async function getRoomPins(id: string) {
  return api.get<{ pins: Post[] }>(API_ROUTES.rooms.pins(id));
}

export async function pinPost(id: string, postId: string) {
  return api.post<null>(API_ROUTES.rooms.pin(id, postId), {});
}

export async function unpinPost(id: string, postId: string) {
  return api.delete<null>(API_ROUTES.rooms.unpin(id, postId));
}

// ── Mutes ───────────────────────────────────────────────────────────────────

export async function getRoomMutes(id: string) {
  return api.get<{ mutes: RoomMute[] }>(API_ROUTES.rooms.mutes(id));
}

export async function muteRoomUser(
  id: string,
  userId: string,
  body?: { mutedUntil?: string },
) {
  return api.post<{ mute: RoomMute }>(API_ROUTES.rooms.mute(id, userId), body ?? {});
}

export async function unmuteRoomUser(id: string, userId: string) {
  return api.delete<null>(API_ROUTES.rooms.unmute(id, userId));
}
