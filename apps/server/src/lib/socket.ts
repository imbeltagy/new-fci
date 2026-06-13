import type { Server as HttpServer } from "http";
import { Server } from "socket.io";

import { authenticateSocket } from "../socket/auth";
import { registerGateway } from "../socket/gateway";
import type { AppServer } from "../socket/types";

let io: AppServer | null = null;

export function initSocket(httpServer: HttpServer): AppServer {
  io = new Server(httpServer, {
    cors: {
      origin: [
        process.env.CLIENT_URL ?? "http://localhost:3000",
        process.env.ADMIN_URL ?? "http://localhost:3001",
      ],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    authenticateSocket(socket, next);
  });

  registerGateway(io);

  return io;
}

export function getIO(): AppServer {
  if (!io) throw new Error("Socket.io not initialized. Call initSocket() first.");
  return io;
}
