"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/common/components/ui/dialog";
import { Input } from "@repo/common/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/common/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/common/components/ui/table";
import { Button } from "@repo/common/components/ui/button";
import { useListTicketsQuery } from "@repo/common/queries/tickets.query";
import type { Ticket, TicketStatus } from "@repo/common/types/ticket";
import { PageHeader } from "@/components/control-panel/page-header";
import { TicketDetailPanel } from "../ticket-detail-panel";

const STATUS_LABEL: Record<TicketStatus, string> = {
  pending: "Pending",
  in_review: "In Review",
  open: "Open",
  rejected: "Rejected",
  done: "Done",
};

const STATUS_BADGE: Record<TicketStatus, string> = {
  pending: "bg-gray-100 text-gray-700",
  in_review: "bg-amber-100 text-amber-700",
  open: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-700",
  done: "bg-emerald-100 text-emerald-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export function TicketsListView() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isPending, isError } = useListTicketsQuery({
    ...(statusFilter !== "all" && { status: statusFilter }),
    ...(search && { search }),
  });
  const tickets = data?.data?.tickets ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="IT Tickets"
        breadcrumbs={[{ label: "Control Panel", href: "/" }, { label: "Tickets" }]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by title or client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TicketStatus | "all")}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_review">In Review</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isPending && <p className="text-sm text-muted-foreground">Loading...</p>}
      {isError && <p className="text-sm text-destructive">Failed to load tickets.</p>}

      {!isPending && !isError && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No tickets found.
                </TableCell>
              </TableRow>
            )}
            {tickets.map((ticket: Ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-medium">{ticket.title}</TableCell>
                <TableCell>{ticket.client.name}</TableCell>
                <TableCell>
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_BADGE[ticket.status]}`}
                  >
                    {STATUS_LABEL[ticket.status]}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(ticket.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setDetailId(ticket.id)}>
                    <MessageSquare className="mr-1 h-3.5 w-3.5" />
                    Manage
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!detailId} onOpenChange={(v) => !v && setDetailId(null)}>
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ticket</DialogTitle>
          </DialogHeader>
          {detailId && <TicketDetailPanel ticketId={detailId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
