import { Role } from "@prisma/client";

import { RoomsService } from "../../rooms/rooms.service";
import type { AppServer, AppSocket } from "../types";

const svc = new RoomsService();

export const roomChannel = (roomId: string) => `room:${roomId}`;

type Ack = (res: { ok: boolean; error?: string }) => void;

const isAdminRole = (role: Role) => role === Role.it || role === Role.superadmin;

export function registerRoomHandlers(io: AppServer, socket: AppSocket): void {
  const { sub, role } = socket.data.user;
  const isAdmin = isAdminRole(role);

  socket.on("room:join", async (roomId: string, ack?: Ack) => {
    try {
      await svc.getRoom(roomId, sub, role, isAdmin);
      socket.join(roomChannel(roomId));
      if (!isAdmin) await svc.markRead(sub, roomId);
      ack?.({ ok: true });
    } catch (err: any) {
      ack?.({ ok: false, error: err.message ?? "Unable to join room" });
    }
  });

  socket.on("room:leave", (roomId: string) => {
    socket.leave(roomChannel(roomId));
  });

  socket.on("room:read", async (roomId: string) => {
    if (!isAdmin) await svc.markRead(sub, roomId);
  });

  socket.on(
    "room:message",
    async (payload: { roomId: string; content: string }, ack?: Ack) => {
      try {
        const message = await svc.postMessage(
          payload.roomId,
          sub,
          role,
          payload.content,
        );
        io.to(roomChannel(payload.roomId)).emit("room:message", message);
        ack?.({ ok: true });
      } catch (err: any) {
        ack?.({ ok: false, error: err.message ?? "Unable to send message" });
      }
    },
  );
}
