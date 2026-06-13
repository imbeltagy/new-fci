"use client";

import { io, type Socket } from "socket.io-client";

import { COOKIES } from "../constants/cookies";
import { getCookie } from "./cookies";

let socket: Socket | null = null;

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

/**
 * Returns the shared socket singleton. The `auth` callback is re-evaluated on
 * every (re)connect, so a freshly refreshed JWT is picked up automatically.
 * Admins authenticate via the `session_id` cookie sent with `withCredentials`.
 */
export function getSocket(): Socket {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: false,
    transports: ["websocket", "polling"],
    auth: (cb) => {
      const token = getCookie(COOKIES.ACCESS_TOKEN);
      cb(token ? { token } : {});
    },
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
