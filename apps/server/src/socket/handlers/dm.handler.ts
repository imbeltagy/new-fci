import { ConversationsService } from "../../conversations/conversations.service";
import type { AppServer, AppSocket } from "../types";
import { userRoom } from "../types";

const svc = new ConversationsService();

type Ack = (res: { ok: boolean; error?: string; message?: unknown }) => void;

export function registerDmHandlers(io: AppServer, socket: AppSocket): void {
  const { sub } = socket.data.user;

  // Catch-up: deliver every message addressed to me that I haven't read yet.
  void (async () => {
    try {
      const pending = await svc.getCatchUp(sub);
      for (const message of pending) {
        socket.emit("dm:new", message);
      }
    } catch {
      // best-effort; the REST history covers the rest
    }
  })();

  socket.on(
    "dm:send",
    async (payload: { conversationId: string; content: string }, ack?: Ack) => {
      try {
        const { message, recipientId } = await svc.postMessage(
          payload.conversationId,
          sub,
          payload.content,
        );
        io.to(userRoom(recipientId)).emit("dm:new", message);
        io.to(userRoom(sub)).emit("dm:new", message);
        ack?.({ ok: true, message });
      } catch (err: any) {
        ack?.({ ok: false, error: err.message ?? "Unable to send message" });
      }
    },
  );

  socket.on("dm:read", async (payload: { conversationId: string }) => {
    try {
      const { messageIds, otherId } = await svc.markRead(payload.conversationId, sub);
      if (messageIds.length > 0) {
        io.to(userRoom(otherId)).emit("dm:read", {
          conversationId: payload.conversationId,
          messageIds,
          readAt: new Date().toISOString(),
        });
      }
    } catch {
      // ignore read failures
    }
  });
}
