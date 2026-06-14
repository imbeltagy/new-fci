"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, GraduationCap, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Input } from "@repo/common/components/ui/input";
import { useListRoomsQuery } from "@repo/common/queries/rooms.query";
import type { Room } from "@repo/common/types/room";

const TYPE_ICON: Record<Room["type"], LucideIcon> = {
  community: Users,
  major_channel: GraduationCap,
  subject_channel: BookOpen,
};

function roomSubtitle(room: Room): string {
  if (room.type === "community") return "Join-year community";
  if (room.type === "major_channel")
    return `${room.major?.name ?? ""} · ${room.joinYear?.year ?? ""}`;
  return room.subject ? room.subject.name : "Subject channel";
}

function RoomCard({ room }: { room: Room }) {
  const Icon = TYPE_ICON[room.type];

  return (
    <Link
      href={`/community/${room.id}`}
      className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{room.name}</p>
        <p className="truncate text-xs text-muted-foreground">{roomSubtitle(room)}</p>
      </div>
    </Link>
  );
}

function Section({ title, rooms }: { title: string; rooms: Room[] }) {
  if (rooms.length === 0) return null;
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
      <div className="space-y-2">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
    </div>
  );
}

export function CommunityView() {
  const [search, setSearch] = useState("");
  const { data, isPending, isError } = useListRoomsQuery();

  const allRooms = data?.data?.rooms ?? [];
  const filtered = search
    ? allRooms.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    : allRooms;

  const community = filtered.filter((r) => r.type === "community");
  const majorChannels = filtered.filter((r) => r.type === "major_channel");
  const subjectChannels = filtered.filter((r) => r.type === "subject_channel");

  return (
    <div className="space-y-6 py-4">
      <h1 className="text-2xl font-bold">Community</h1>

      <Input
        placeholder="Search channels..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {isPending && <p className="text-sm text-muted-foreground">Loading...</p>}
      {isError && <p className="text-sm text-destructive">Failed to load channels.</p>}

      {!isPending && !isError && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">No channels yet.</p>
      )}

      <Section title="Community" rooms={community} />
      <Section title="Major channels" rooms={majorChannels} />
      <Section title="Subject channels" rooms={subjectChannels} />
    </div>
  );
}
