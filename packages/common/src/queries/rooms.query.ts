"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getPost,
  getPostComments,
  getRoom,
  getRoomMutes,
  getRoomPins,
  getRoomPosts,
  listRooms,
} from "../actions/rooms.action";

export const ROOM_KEYS = {
  all: ["rooms"] as const,
  list: () => ["rooms", "list"] as const,
  detail: (id: string) => ["rooms", "detail", id] as const,
  posts: (id: string) => ["rooms", "posts", id] as const,
  post: (id: string, postId: string) => ["rooms", "post", id, postId] as const,
  comments: (id: string, postId: string) => ["rooms", "comments", id, postId] as const,
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

/** First (most recent) page of the feed. Older pages are fetched imperatively on scroll. */
export function useRoomPostsQuery(id: string) {
  return useQuery({
    queryKey: ROOM_KEYS.posts(id),
    queryFn: () => getRoomPosts(id),
    enabled: !!id,
  });
}

export function usePostQuery(id: string, postId: string) {
  return useQuery({
    queryKey: ROOM_KEYS.post(id, postId),
    queryFn: () => getPost(id, postId),
    enabled: !!id && !!postId,
  });
}

export function usePostCommentsQuery(id: string, postId: string) {
  return useQuery({
    queryKey: ROOM_KEYS.comments(id, postId),
    queryFn: () => getPostComments(id, postId),
    enabled: !!id && !!postId,
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
