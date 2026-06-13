import { Role } from "@prisma/client";

import type { AppSocket } from "../types";
import { IT_STAFF_ROOM } from "../types";

/**
 * IT-side users join a shared room so any of them receives ticket events. The
 * actual emits happen from the tickets service after persistence.
 */
export function registerTicketHandlers(socket: AppSocket): void {
  const { role } = socket.data.user;
  if (role === Role.it || role === Role.superadmin) {
    socket.join(IT_STAFF_ROOM);
  }
}
