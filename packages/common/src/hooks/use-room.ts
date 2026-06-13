"use client";

import { useCallback, useEffect, useRef } from "react";

import type { RoomMessage } from "../types/message";
import { useSocket } from "./use-socket";

interface SocketAck {
  ok: boolean;
  error?: string;
}

/**
 * Joins a room over the socket, streams live messages to `onMessage`, and
 * exposes `sendMessage`. Leaves the room on unmount.
 */
export function useRoom(roomId: string, onMessage: (m: RoomMessage) => void) {
  const { socket, connected } = useSocket();
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!connected || !roomId) return;

    socket.emit("room:join", roomId);

    const handler = (m: RoomMessage) => {
      if (m.roomId === roomId) onMessageRef.current(m);
    };
    socket.on("room:message", handler);

    return () => {
      socket.emit("room:leave", roomId);
      socket.off("room:message", handler);
    };
  }, [socket, connected, roomId]);

  const sendMessage = useCallback(
    (content: string) =>
      new Promise<void>((resolve, reject) => {
        socket.emit("room:message", { roomId, content }, (res: SocketAck) => {
          if (res?.ok) resolve();
          else reject(new Error(res?.error ?? "Failed to send message"));
        });
      }),
    [socket, roomId],
  );

  const markRead = useCallback(() => {
    socket.emit("room:read", roomId);
  }, [socket, roomId]);

  return { sendMessage, markRead, connected };
}
