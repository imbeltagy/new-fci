import { Role } from "@prisma/client";

import { RoomsService } from "../../rooms/rooms.service";
import type { AppServer, AppSocket } from "../types";
import { roomChannel } from "../types";

const svc = new RoomsService();

type Ack = (res: { ok: boolean; error?: string }) => void;

const isAdminRole = (role: Role) => role === Role.it || role === Role.superadmin;

/**
 * Rooms are now feeds: posts, likes and comment counts are pushed to the
 * `room:{id}` channel by the rooms service after each REST write. The socket's
 * only job here is to subscribe a member to (and unsubscribe from) that channel.
 */
export function registerRoomHandlers(_io: AppServer, socket: AppSocket): void {
  const { sub, role } = socket.data.user;
  const isAdmin = isAdminRole(role);

  socket.on("room:join", async (roomId: string, ack?: Ack) => {
    try {
      await svc.getRoom(roomId, sub, role, isAdmin);
      socket.join(roomChannel(roomId));
      ack?.({ ok: true });
    } catch (err: any) {
      ack?.({ ok: false, error: err.message ?? "Unable to join room" });
    }
  });

  socket.on("room:leave", (roomId: string) => {
    socket.leave(roomChannel(roomId));
  });
}
