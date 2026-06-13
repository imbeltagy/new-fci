"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { sendTicketMessage, updateTicketStatus } from "@repo/common/actions/tickets.action";
import { Button } from "@repo/common/components/ui/button";
import { Input } from "@repo/common/components/ui/input";
import { Label } from "@repo/common/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/common/components/ui/select";
import { useSocket } from "@repo/common/hooks/use-socket";
import { TICKET_KEYS, useTicketQuery } from "@repo/common/queries/tickets.query";
import type { TicketStatus, UpdateTicketStatusBody } from "@repo/common/types/ticket";

const STATUS_OPTIONS: { label: string; value: Exclude<TicketStatus, "pending"> }[] = [
  { label: "In Review", value: "in_review" },
  { label: "Open", value: "open" },
  { label: "Rejected", value: "rejected" },
  { label: "Done", value: "done" },
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TicketDetailPanel({ ticketId }: { ticketId: string }) {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { data, isPending } = useTicketQuery(ticketId);

  const [nextStatus, setNextStatus] = useState<Exclude<TicketStatus, "pending"> | "">("");
  const [reason, setReason] = useState("");
  const [applying, setApplying] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const ticket = data?.data?.ticket;
  const messages = data?.data?.messages ?? [];

  // Live updates for this ticket.
  useEffect(() => {
    const refresh = () =>
      queryClient.invalidateQueries({ queryKey: TICKET_KEYS.detail(ticketId) });
    socket.on("ticket:message", refresh);
    socket.on("ticket:status", refresh);
    return () => {
      socket.off("ticket:message", refresh);
      socket.off("ticket:status", refresh);
    };
  }, [socket, queryClient, ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages.length]);

  async function applyStatus() {
    if (!nextStatus) return;
    if (nextStatus === "rejected" && !reason.trim()) {
      toast.error("A rejection reason is required.");
      return;
    }
    setApplying(true);
    const body: UpdateTicketStatusBody = {
      status: nextStatus,
      ...(nextStatus === "rejected" && { rejectionReason: reason.trim() }),
    };
    const res = await updateTicketStatus(ticketId, body);
    setApplying(false);
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    toast.success("Status updated.");
    setNextStatus("");
    setReason("");
    queryClient.invalidateQueries({ queryKey: TICKET_KEYS.all });
  }

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
    queryClient.invalidateQueries({ queryKey: TICKET_KEYS.detail(ticketId) });
  }

  if (isPending || !ticket) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  const conversationActive = ticket.status === "open" || ticket.status === "done";

  return (
    <div className="space-y-5">
      {/* Ticket body */}
      <div className="space-y-1 rounded-lg border bg-muted/40 p-3">
        <p className="text-sm font-semibold">{ticket.title}</p>
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{ticket.body}</p>
        <p className="pt-1 text-xs text-muted-foreground">
          {ticket.client.name} · {ticket.client.email} · {formatTime(ticket.createdAt)}
        </p>
      </div>

      {/* Status control */}
      <div className="space-y-2">
        <Label>Change status</Label>
        <div className="flex gap-2">
          <Select
            value={nextStatus}
            onValueChange={(v) => setNextStatus(v as Exclude<TicketStatus, "pending">)}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select new status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={applyStatus} disabled={applying || !nextStatus}>
            Apply
          </Button>
        </div>
        {nextStatus === "rejected" && (
          <Input
            placeholder="Rejection reason (required)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}
        {ticket.status === "rejected" && ticket.rejectionReason && (
          <p className="text-xs text-destructive">
            Rejected: {ticket.rejectionReason}
          </p>
        )}
      </div>

      {/* Conversation */}
      {conversationActive ? (
        <div className="space-y-2">
          <Label>Conversation</Label>
          <div className="max-h-[40vh] space-y-2 overflow-y-auto rounded-lg border p-3">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={m.isItSide ? "flex justify-end" : "flex justify-start"}>
                <div className="max-w-[80%] space-y-0.5">
                  <div
                    className={
                      m.isItSide
                        ? "rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
                        : "rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm"
                    }
                  >
                    {m.content}
                  </div>
                  <p className={`text-[10px] text-muted-foreground ${m.isItSide ? "text-right" : ""}`}>
                    {m.sender.name} · {formatTime(m.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Reply as IT Support..."
            />
            <Button size="icon" onClick={handleSend} disabled={sending || !draft.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Move the ticket to <span className="font-medium">Open</span> to start a conversation.
        </p>
      )}
    </div>
  );
}
