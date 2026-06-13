"use client";

import { useCallback, useEffect, useRef } from "react";

import type { DirectMessage, DmReadEvent } from "../types/conversation";
import { useSocket } from "./use-socket";

interface SocketAck {
  ok: boolean;
  error?: string;
  message?: DirectMessage;
}

/**
 * Streams a single conversation over the socket. `onMessage` fires for every
 * delivered message (including the echo of ones you send — dedupe by id).
 * `onRead` fires when the other participant reads your messages.
 */
export function useDm(
  conversationId: string,
  handlers: { onMessage: (m: DirectMessage) => void; onRead: (e: DmReadEvent) => void },
) {
  const { socket, connected } = useSocket();
  const onMessageRef = useRef(handlers.onMessage);
  const onReadRef = useRef(handlers.onRead);
  onMessageRef.current = handlers.onMessage;
  onReadRef.current = handlers.onRead;

  useEffect(() => {
    if (!conversationId) return;

    const msgHandler = (m: DirectMessage) => {
      if (m.conversationId === conversationId) onMessageRef.current(m);
    };
    const readHandler = (e: DmReadEvent) => {
      if (e.conversationId === conversationId) onReadRef.current(e);
    };

    socket.on("dm:new", msgHandler);
    socket.on("dm:read", readHandler);

    return () => {
      socket.off("dm:new", msgHandler);
      socket.off("dm:read", readHandler);
    };
  }, [socket, conversationId]);

  const sendMessage = useCallback(
    (content: string) =>
      new Promise<void>((resolve, reject) => {
        socket.emit("dm:send", { conversationId, content }, (res: SocketAck) => {
          if (res?.ok) resolve();
          else reject(new Error(res?.error ?? "Failed to send message"));
        });
      }),
    [socket, conversationId],
  );

  const markRead = useCallback(() => {
    socket.emit("dm:read", { conversationId });
  }, [socket, conversationId]);

  return { sendMessage, markRead, connected };
}
