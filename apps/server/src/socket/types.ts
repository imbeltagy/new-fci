import type { DefaultEventsMap, Server, Socket } from "socket.io";

import type { Role } from "@prisma/client";

export interface SocketUser {
  sub: string;
  role: Role;
  permissions: string[];
}

export interface SocketData {
  user: SocketUser;
}

export type AppServer = Server<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  SocketData
>;

export type AppSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  SocketData
>;

/** Personal room every user joins on connect — used for direct, user-targeted pushes. */
export const userRoom = (userId: string) => `user:${userId}`;

/** Shared room every admin (it / superadmin) joins — the IT-side of ticket conversations. */
export const IT_STAFF_ROOM = "it:staff";
