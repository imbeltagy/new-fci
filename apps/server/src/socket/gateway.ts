import { registerDmHandlers } from "./handlers/dm.handler";
import { registerRoomHandlers } from "./handlers/rooms.handler";
import { registerTicketHandlers } from "./handlers/tickets.handler";
import type { AppServer, AppSocket } from "./types";
import { userRoom } from "./types";

/**
 * Wires every connection to its per-feature handlers. Each feature registers
 * its own socket events and its on-connect catch-up logic here.
 */
export function registerGateway(io: AppServer): void {
  io.on("connection", (socket: AppSocket) => {
    const { sub } = socket.data.user;

    // Personal room — lets the server push directly to this user from anywhere.
    socket.join(userRoom(sub));

    registerRoomHandlers(io, socket);
    registerDmHandlers(io, socket);
    registerTicketHandlers(socket);

    socket.on("disconnect", () => {
      // No-op for now; per-feature cleanup can hook in here later.
    });
  });
}
