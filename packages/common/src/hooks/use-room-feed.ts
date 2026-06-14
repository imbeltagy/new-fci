"use client";

import { useEffect, useRef } from "react";

import type {
  Post,
  PostCommentEvent,
  PostDeletedEvent,
  PostLikeEvent,
} from "../types/post";
import { useSocket } from "./use-socket";

interface FeedHandlers {
  onNewPost?: (post: Post) => void;
  onLike?: (e: PostLikeEvent) => void;
  onComment?: (e: PostCommentEvent) => void;
  onDeleted?: (e: PostDeletedEvent) => void;
}

/**
 * Subscribes to a room's live feed events. Joins the room channel on mount and
 * leaves on unmount; since only the open feed is joined, every received event
 * belongs to this room.
 */
export function useRoomFeed(roomId: string, handlers: FeedHandlers) {
  const { socket, connected } = useSocket();
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    if (!connected || !roomId) return;

    socket.emit("room:join", roomId);

    const onNew = (post: Post) => {
      if (post.roomId === roomId) ref.current.onNewPost?.(post);
    };
    const onLike = (e: PostLikeEvent) => ref.current.onLike?.(e);
    const onComment = (e: PostCommentEvent) => ref.current.onComment?.(e);
    const onDeleted = (e: PostDeletedEvent) => ref.current.onDeleted?.(e);

    socket.on("post:new", onNew);
    socket.on("post:like", onLike);
    socket.on("post:comment", onComment);
    socket.on("post:deleted", onDeleted);

    return () => {
      socket.emit("room:leave", roomId);
      socket.off("post:new", onNew);
      socket.off("post:like", onLike);
      socket.off("post:comment", onComment);
      socket.off("post:deleted", onDeleted);
    };
  }, [socket, connected, roomId]);

  return { connected };
}
