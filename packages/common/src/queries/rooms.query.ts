"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getRoom,
  getRoomMessages,
  getRoomMutes,
  getRoomPins,
  listRooms,
} from "../actions/rooms.action";

export const ROOM_KEYS = {
  all: ["rooms"] as const,
  list: () => ["rooms", "list"] as const,
  detail: (id: string) => ["rooms", "detail", id] as const,
  messages: (id: string) => ["rooms", "messages", id] as const,
  pins: (id: string) => ["rooms", "pins", id] as const,
  mutes: (id: string) => ["rooms", "mutes", id] as const,
};

export function useListRoomsQuery() {
  return useQuery({
    queryKey: ROOM_KEYS.list(),
    queryFn: listRooms,
  });
}

export function useRoomQuery(id: string) {
  return useQuery({
    queryKey: ROOM_KEYS.detail(id),
    queryFn: () => getRoom(id),
    enabled: !!id,
  });
}

/** First (most recent) page of history. Older pages are fetched imperatively on scroll. */
export function useRoomMessagesQuery(id: string) {
  return useQuery({
    queryKey: ROOM_KEYS.messages(id),
    queryFn: () => getRoomMessages(id),
    enabled: !!id,
  });
}

export function useRoomPinsQuery(id: string, enabled = true) {
  return useQuery({
    queryKey: ROOM_KEYS.pins(id),
    queryFn: () => getRoomPins(id),
    enabled: !!id && enabled,
  });
}

export function useRoomMutesQuery(id: string, enabled = true) {
  return useQuery({
    queryKey: ROOM_KEYS.mutes(id),
    queryFn: () => getRoomMutes(id),
    enabled: !!id && enabled,
  });
}
