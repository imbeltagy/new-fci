"use client";

import { useState } from "react";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { deleteRoom } from "@repo/common/actions/rooms.action";
import { ConfirmDialog } from "@repo/common/components/custom/confirm-dialog";
import { Button } from "@repo/common/components/ui/button";
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
import { ROOM_KEYS, useListRoomsQuery } from "@repo/common/queries/rooms.query";
import type { Room, RoomType } from "@repo/common/types/room";
import { PageHeader } from "@/components/control-panel/page-header";
import { RoomDetailPanel } from "../room-detail-panel";
import { RoomForm } from "../room-form";

const TYPE_LABEL: Record<RoomType, string> = {
  community: "Community",
  major_channel: "Major Channel",
  subject_channel: "Subject Channel",
};

const TYPE_BADGE: Record<RoomType, string> = {
  community: "bg-blue-100 text-blue-700",
  major_channel: "bg-purple-100 text-purple-700",
  subject_channel: "bg-emerald-100 text-emerald-700",
};

function roomScope(room: Room): string {
  if (room.type === "community") return room.joinYear ? `${room.joinYear.year}` : "—";
  if (room.type === "major_channel")
    return `${room.major?.code ?? "—"} · ${room.joinYear?.year ?? "—"}`;
  return room.subject ? `${room.subject.code}` : "—";
}

export function RoomsListView() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<Room | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<RoomType | "all">("all");

  const { data, isPending, isError } = useListRoomsQuery();
  const allRooms = data?.data?.rooms ?? [];

  const rooms = allRooms.filter((r) => {
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ROOM_KEYS.list() });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await deleteRoom(deleteTarget.id);
    if (!res.success) {
      toast.error(res.message);
      throw new Error(res.message);
    }
    toast.success("Room deleted.");
    invalidate();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Channels & Community"
        breadcrumbs={[{ label: "Control Panel", href: "/" }, { label: "Rooms" }]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as RoomType | "all")}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="community">Community</SelectItem>
            <SelectItem value="major_channel">Major Channel</SelectItem>
            <SelectItem value="subject_channel">Subject Channel</SelectItem>
          </SelectContent>
        </Select>
        <Button className="ml-auto" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Room
        </Button>
      </div>

      {isPending && <p className="text-sm text-muted-foreground">Loading...</p>}
      {isError && <p className="text-sm text-destructive">Failed to load rooms.</p>}

      {!isPending && !isError && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No rooms found.
                </TableCell>
              </TableRow>
            )}
            {rooms.map((room) => (
              <TableRow key={room.id}>
                <TableCell className="font-medium">{room.name}</TableCell>
                <TableCell>
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${TYPE_BADGE[room.type]}`}
                  >
                    {TYPE_LABEL[room.type]}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{roomScope(room)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setDetailTarget(room)}>
                      <MessageSquare className="mr-1 h-3.5 w-3.5" />
                      Moderate
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(room)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={createOpen} onOpenChange={(v) => !v && setCreateOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Room</DialogTitle>
          </DialogHeader>
          <RoomForm
            onSuccess={() => {
              invalidate();
              setCreateOpen(false);
            }}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailTarget} onOpenChange={(v) => !v && setDetailTarget(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Moderate — {detailTarget?.name}</DialogTitle>
          </DialogHeader>
          {detailTarget && <RoomDetailPanel room={detailTarget} />}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Room"
        message={`Delete "${deleteTarget?.name ?? ""}"? All its messages will be removed.`}
        onClose={() => setDeleteTarget(null)}
        onSubmit={handleDelete}
      />
    </div>
  );
}
