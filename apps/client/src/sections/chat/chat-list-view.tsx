"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";

import { Input } from "@repo/common/components/ui/input";
import { useSocket } from "@repo/common/hooks/use-socket";
import {
  CONVERSATION_KEYS,
  useListConversationsQuery,
} from "@repo/common/queries/conversations.query";
import type { ConversationListItem } from "@repo/common/types/conversation";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function ConversationRow({ conversation }: { conversation: ConversationListItem }) {
  const { other, lastMessage, unread } = conversation;
  return (
    <Link
      href={`/chat/${conversation.id}`}
      className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-semibold text-muted-foreground">
        {other.avatarUrl ? (
          <img src={other.avatarUrl} alt={other.name} className="h-full w-full object-cover" />
        ) : (
          initials(other.name)
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-medium">{other.name}</p>
          {lastMessage && (
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {formatTime(lastMessage.createdAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm text-muted-foreground">
            {lastMessage?.content ?? "No messages yet"}
          </p>
          {unread > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ChatListView() {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const [search, setSearch] = useState("");
  const { data, isPending, isError } = useListConversationsQuery();

  // Keep the list fresh as messages flow in or get read.
  useEffect(() => {
    const refresh = () =>
      queryClient.invalidateQueries({ queryKey: CONVERSATION_KEYS.list() });
    socket.on("dm:new", refresh);
    socket.on("dm:read", refresh);
    return () => {
      socket.off("dm:new", refresh);
      socket.off("dm:read", refresh);
    };
  }, [socket, queryClient]);

  const conversations = data?.data?.conversations ?? [];
  const filtered = search
    ? conversations.filter((c) => c.other.name.toLowerCase().includes(search.toLowerCase()))
    : conversations;

  return (
    <div className="space-y-4 py-4">
      <h1 className="text-2xl font-bold">Chat</h1>

      <Input
        placeholder="Search conversations..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {isPending && <p className="text-sm text-muted-foreground">Loading...</p>}
      {isError && <p className="text-sm text-destructive">Failed to load conversations.</p>}

      {!isPending && !isError && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No conversations yet. Open a member&apos;s profile from a channel to start chatting.
        </p>
      )}

      <div className="space-y-1">
        {filtered.map((c) => (
          <ConversationRow key={c.id} conversation={c} />
        ))}
      </div>
    </div>
  );
}
