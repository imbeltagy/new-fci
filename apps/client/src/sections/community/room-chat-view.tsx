"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pin, Send } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getRoomMessages, pinRoomMessage, unpinRoomMessage } from "@repo/common/actions/rooms.action";
import { Button } from "@repo/common/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/common/components/ui/dialog";
import { Input } from "@repo/common/components/ui/input";
import { useRoom } from "@repo/common/hooks/use-room";
import {
  ROOM_KEYS,
  useRoomMessagesQuery,
  useRoomPinsQuery,
  useRoomQuery,
} from "@repo/common/queries/rooms.query";
import { useAuthStore } from "@repo/common/stores/auth.store";
import type { RoomMessage } from "@repo/common/types/message";
import { cn } from "@repo/common/lib/utils";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function MessageBubble({
  message,
  isOwn,
  canPin,
  onPin,
  onUnpin,
}: {
  message: RoomMessage;
  isOwn: boolean;
  canPin: boolean;
  onPin: (id: string) => void;
  onUnpin: (id: string) => void;
}) {
  if (isOwn) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] space-y-1">
          <div className="rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
            {message.content}
          </div>
          <p className="pr-1 text-right text-[10px] text-muted-foreground">
            {formatTime(message.createdAt)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold text-muted-foreground">
        {message.sender.avatarUrl ? (
          <img src={message.sender.avatarUrl} alt={message.sender.name} className="h-full w-full object-cover" />
        ) : (
          initials(message.sender.name)
        )}
      </div>
      <div className="min-w-0 max-w-[75%] space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">{message.sender.name}</span>
          {message.isStaff && (
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              Faculty
            </span>
          )}
        </div>
        <div
          className={cn(
            "group relative rounded-2xl rounded-tl-sm px-3 py-2 text-sm",
            message.isStaff
              ? "border-l-2 border-primary bg-primary/5"
              : "bg-muted",
          )}
        >
          {message.content}
          {canPin && (
            <button
              onClick={() => (message.isPinned ? onUnpin(message.id) : onPin(message.id))}
              className="absolute -right-2 -top-2 hidden rounded-full border bg-card p-1 text-muted-foreground shadow-sm group-hover:block"
              title={message.isPinned ? "Unpin" : "Pin"}
            >
              <Pin className={cn("h-3 w-3", message.isPinned && "fill-primary text-primary")} />
            </button>
          )}
        </div>
        <p className="pl-1 text-[10px] text-muted-foreground">{formatTime(message.createdAt)}</p>
      </div>
    </div>
  );
}

export function RoomChatView({ roomId }: { roomId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const currentUserRole = useAuthStore((s) => s.user?.role);
  const canPin = currentUserRole === "teacher" || currentUserRole === "sub_teacher";

  const { data: roomData } = useRoomQuery(roomId);
  const { data: initialData } = useRoomMessagesQuery(roomId);

  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [pinsOpen, setPinsOpen] = useState(false);
  const seededRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: pinsData } = useRoomPinsQuery(roomId, pinsOpen);
  const pins = pinsData?.data?.pins ?? [];

  useEffect(() => {
    if (initialData?.data && !seededRef.current) {
      seededRef.current = true;
      setMessages(initialData.data.messages);
      setCursor(initialData.data.nextCursor);
      setHasMore(initialData.data.hasMore);
    }
  }, [initialData]);

  const handleIncoming = useCallback((m: RoomMessage) => {
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
  }, []);

  const { sendMessage } = useRoom(roomId, handleIncoming);

  // Auto-scroll to bottom when messages change.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages.length]);

  async function loadOlder() {
    if (!cursor || loadingOlder) return;
    setLoadingOlder(true);
    const res = await getRoomMessages(roomId, { before: cursor });
    if (res.success && res.data) {
      setMessages((prev) => [...res.data!.messages, ...prev]);
      setCursor(res.data.nextCursor);
      setHasMore(res.data.hasMore);
    }
    setLoadingOlder(false);
  }

  async function handleSend() {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      await sendMessage(content);
      setDraft("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  async function handlePin(messageId: string) {
    const res = await pinRoomMessage(roomId, messageId);
    if (!res.success) return toast.error(res.message);
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, isPinned: true } : m)));
    queryClient.invalidateQueries({ queryKey: ROOM_KEYS.pins(roomId) });
  }

  async function handleUnpin(messageId: string) {
    const res = await unpinRoomMessage(roomId, messageId);
    if (!res.success) return toast.error(res.message);
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, isPinned: false } : m)));
    queryClient.invalidateQueries({ queryKey: ROOM_KEYS.pins(roomId) });
  }

  const room = roomData?.data?.room;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-card px-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/community")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{room?.name ?? "Channel"}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setPinsOpen(true)} title="Pinned messages">
          <Pin className="h-5 w-5" />
        </Button>
      </header>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {hasMore && (
          <div className="flex justify-center">
            <Button variant="outline" size="sm" onClick={loadOlder} disabled={loadingOlder}>
              {loadingOlder ? "Loading..." : "Load earlier messages"}
            </Button>
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            isOwn={m.senderId === currentUserId}
            canPin={canPin}
            onPin={handlePin}
            onUnpin={handleUnpin}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="flex shrink-0 items-center gap-2 border-t bg-card p-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message..."
        />
        <Button size="icon" onClick={handleSend} disabled={sending || !draft.trim()}>
          <Send className="h-5 w-5" />
        </Button>
      </div>

      {/* Pinned messages dialog */}
      <Dialog open={pinsOpen} onOpenChange={setPinsOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pinned messages</DialogTitle>
          </DialogHeader>
          {pins.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pinned messages.</p>
          ) : (
            <div className="space-y-3">
              {pins.map((m) => (
                <div key={m.id} className="rounded-lg border p-3">
                  <p className="text-xs font-semibold">{m.sender.name}</p>
                  <p className="text-sm text-muted-foreground">{m.content}</p>
                  {canPin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-7 px-2 text-xs"
                      onClick={() => handleUnpin(m.id)}
                    >
                      Unpin
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
