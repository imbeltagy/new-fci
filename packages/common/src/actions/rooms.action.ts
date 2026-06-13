"use client";

import { API_ROUTES } from "../constants/api";
import { api } from "../lib/api-client";
import type { RoomMessage, RoomMessagesPage } from "../types/message";
import type { CreateRoomBody, Room, RoomMute } from "../types/room";

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

export async function getRoomMessages(
  id: string,
  params?: { before?: string; limit?: number },
) {
  return api.get<RoomMessagesPage>(API_ROUTES.rooms.messages(id), {
    queries: {
      ...(params?.before && { before: params.before }),
      ...(params?.limit && { limit: String(params.limit) }),
    },
  });
}

export async function deleteRoomMessage(id: string, messageId: string) {
  return api.delete<null>(API_ROUTES.rooms.deleteMessage(id, messageId));
}

export async function getRoomPins(id: string) {
  return api.get<{ pins: RoomMessage[] }>(API_ROUTES.rooms.pins(id));
}

export async function pinRoomMessage(id: string, messageId: string) {
  return api.post<null>(API_ROUTES.rooms.pin(id, messageId), {});
}

export async function unpinRoomMessage(id: string, messageId: string) {
  return api.delete<null>(API_ROUTES.rooms.unpin(id, messageId));
}

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
