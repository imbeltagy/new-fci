"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";

import { sendTicketMessage } from "@repo/common/actions/tickets.action";
import { Button } from "@repo/common/components/ui/button";
import { Input } from "@repo/common/components/ui/input";
import { useSocket } from "@repo/common/hooks/use-socket";
import { useTicketQuery } from "@repo/common/queries/tickets.query";
import type { TicketMessage, TicketStatus, TicketStatusEvent } from "@repo/common/types/ticket";

const STATUS_LABEL: Record<TicketStatus, string> = {
  pending: "Pending",
  in_review: "In Review",
  open: "Open",
  rejected: "Rejected",
  done: "Done",
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function TicketChatView({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const { socket } = useSocket();
  const { data, isPending } = useTicketQuery(ticketId);

  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [status, setStatus] = useState<TicketStatus>("open");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const seededRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data?.data && !seededRef.current) {
      seededRef.current = true;
      setMessages(data.data.messages);
      setStatus(data.data.ticket.status);
    }
  }, [data]);

  useEffect(() => {
    const onMsg = (m: TicketMessage) => {
      if (m.ticketId === ticketId) {
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      }
    };
    const onStatus = (e: TicketStatusEvent) => {
      if (e.ticketId === ticketId) setStatus(e.status);
    };
    socket.on("ticket:message", onMsg);
    socket.on("ticket:status", onStatus);
    return () => {
      socket.off("ticket:message", onMsg);
      socket.off("ticket:status", onStatus);
    };
  }, [socket, ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages.length]);

  async function handleSend() {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    const res = await sendTicketMessage(ticketId, content);
    setSending(false);
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    setDraft("");
  }

  const ticket = data?.data?.ticket;
  const canSend = status === "open";

  return (
    <div className="fixed inset-x-0 top-0 bottom-16 z-40 flex flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-card px-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/settings/tickets")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{ticket?.title ?? "IT Support"}</p>
          <p className="text-xs text-muted-foreground">{STATUS_LABEL[status]}</p>
        </div>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {isPending && <p className="text-sm text-muted-foreground">Loading...</p>}
        {messages.map((m) => {
          const fromIt = m.isItSide;
          return (
            <div key={m.id} className={fromIt ? "flex justify-start" : "flex justify-end"}>
              <div className="max-w-[78%] space-y-0.5">
                {fromIt && <p className="text-[10px] font-semibold text-primary">IT Support</p>}
                <div
                  className={
                    fromIt
                      ? "rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm"
                      : "rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
                  }
                >
                  {m.content}
                </div>
                <p className={`text-[10px] text-muted-foreground ${fromIt ? "" : "text-right"}`}>
                  {formatTime(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t bg-card p-3">
        {canSend ? (
          <div className="flex items-center gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Message IT Support..."
            />
            <Button size="icon" onClick={handleSend} disabled={sending || !draft.trim()}>
              <Send className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            This ticket is closed. You can no longer send messages.
          </p>
        )}
      </div>
    </div>
  );
}
