"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createTicket } from "@repo/common/actions/tickets.action";
import { Button } from "@repo/common/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/common/components/ui/dialog";
import { Input } from "@repo/common/components/ui/input";
import { Label } from "@repo/common/components/ui/label";
import { TICKET_KEYS, useListTicketsQuery } from "@repo/common/queries/tickets.query";
import type { Ticket, TicketStatus } from "@repo/common/types/ticket";

const STATUS_LABEL: Record<TicketStatus, string> = {
  pending: "Pending",
  in_review: "In Review",
  open: "Open",
  rejected: "Rejected",
  done: "Done",
};

const STATUS_BADGE: Record<TicketStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  in_review: "bg-amber-100 text-amber-700",
  open: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-700",
  done: "bg-emerald-100 text-emerald-700",
};

function CreateTicketDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!title.trim() || !body.trim()) {
      toast.error("Please fill in both fields.");
      return;
    }
    setSubmitting(true);
    const res = await createTicket({ title: title.trim(), body: body.trim() });
    setSubmitting(false);
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    toast.success("Ticket submitted.");
    setTitle("");
    setBody("");
    onCreated();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New support ticket</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ticket-title">Title</Label>
            <Input
              id="ticket-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short summary"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ticket-body">Describe the issue</Label>
            <textarea
              id="ticket-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="What's going wrong?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TicketRow({ ticket }: { ticket: Ticket }) {
  const router = useRouter();
  const hasConversation = ticket.status === "open" || ticket.status === "done";

  return (
    <button
      onClick={() => hasConversation && router.push(`/chat/ticket/${ticket.id}`)}
      className="flex w-full items-start gap-3 rounded-lg border bg-card p-4 text-left transition-colors enabled:hover:bg-muted"
      disabled={!hasConversation}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{ticket.title}</span>
        </div>
        <span
          className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_BADGE[ticket.status]}`}
        >
          {STATUS_LABEL[ticket.status]}
        </span>
        {ticket.status === "rejected" && ticket.rejectionReason && (
          <p className="text-xs text-destructive">Reason: {ticket.rejectionReason}</p>
        )}
      </div>
      {hasConversation && <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />}
    </button>
  );
}

export function TicketsView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isPending, isError } = useListTicketsQuery();

  const tickets = data?.data?.tickets ?? [];

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push("/settings")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="flex-1 text-xl font-bold">Support tickets</h1>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New
        </Button>
      </div>

      {isPending && <p className="text-sm text-muted-foreground">Loading...</p>}
      {isError && <p className="text-sm text-destructive">Failed to load tickets.</p>}

      {!isPending && !isError && tickets.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No tickets yet. Tap <span className="font-medium">New</span> to ask IT for help.
        </p>
      )}

      <div className="space-y-2">
        {tickets.map((t) => (
          <TicketRow key={t.id} ticket={t} />
        ))}
      </div>

      <CreateTicketDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => queryClient.invalidateQueries({ queryKey: TICKET_KEYS.all })}
      />
    </div>
  );
}
