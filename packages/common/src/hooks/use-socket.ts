"use client";

import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";

import { getSocket } from "../lib/socket-client";

/**
 * Provides the shared socket singleton and its live connection state. Connects
 * on mount; safe to call from multiple components (they share one connection).
 */
export function useSocket(): { socket: Socket; connected: boolean } {
  const [socket] = useState(() => getSocket());
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    function onConnect() {
      setConnected(true);
    }
    function onDisconnect() {
      setConnected(false);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    if (!socket.connected) socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket]);

  return { socket, connected };
}
