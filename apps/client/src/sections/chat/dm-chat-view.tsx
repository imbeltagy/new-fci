"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, CheckCheck, Send } from "lucide-react";
import { toast } from "sonner";

import { getConversationMessages } from "@repo/common/actions/conversations.action";
import { Button } from "@repo/common/components/ui/button";
import { Input } from "@repo/common/components/ui/input";
import { useDm } from "@repo/common/hooks/use-dm";
import {
  useConversationMessagesQuery,
  useConversationQuery,
} from "@repo/common/queries/conversations.query";
import { useAuthStore } from "@repo/common/stores/auth.store";
import type { DirectMessage } from "@repo/common/types/conversation";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function DmChatView({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const { data: convData } = useConversationQuery(conversationId);
  const { data: initial } = useConversationMessagesQuery(conversationId);

  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [page, setPage] = useState(-1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const seededRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initial?.data && !seededRef.current) {
      seededRef.current = true;
      setMessages(initial.data.messages);
      setPage(initial.data.page);
      setHasMore(initial.data.hasMore);
    }
  }, [initial]);

  const handleNew = useCallback((m: DirectMessage) => {
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
  }, []);

  const handleRead = useCallback((e: { messageIds: string[]; readAt: string }) => {
    setMessages((prev) =>
      prev.map((m) => (e.messageIds.includes(m.id) ? { ...m, readAt: e.readAt } : m)),
    );
  }, []);

  const { sendMessage, markRead } = useDm(conversationId, {
    onMessage: handleNew,
    onRead: handleRead,
  });

  // Mark read on open and whenever new messages land.
  useEffect(() => {
    markRead();
  }, [markRead, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages.length]);

  async function loadOlder() {
    if (loadingOlder || !hasMore) return;
    setLoadingOlder(true);
    const nextPage = page - 1;
    const res = await getConversationMessages(conversationId, { page: nextPage });
    if (res.success && res.data) {
      setMessages((prev) => {
        const existing = new Set(prev.map((m) => m.id));
        const older = res.data!.messages.filter((m) => !existing.has(m.id));
        return [...older, ...prev];
      });
      setPage(res.data.page);
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

  const other = convData?.data?.conversation.other;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-card px-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/chat")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold text-muted-foreground">
          {other?.avatarUrl ? (
            <img src={other.avatarUrl} alt={other.name} className="h-full w-full object-cover" />
          ) : (
            other ? initials(other.name) : ""
          )}
        </div>
        <p className="min-w-0 flex-1 truncate font-semibold">{other?.name ?? "Chat"}</p>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {hasMore && (
          <div className="flex justify-center">
            <Button variant="outline" size="sm" onClick={loadOlder} disabled={loadingOlder}>
              {loadingOlder ? "Loading..." : "Load earlier messages"}
            </Button>
          </div>
        )}
        {messages.map((m) => {
          const isOwn = m.senderId === currentUserId;
          return (
            <div key={m.id} className={isOwn ? "flex justify-end" : "flex justify-start"}>
              <div className="max-w-[75%] space-y-0.5">
                <div
                  className={
                    isOwn
                      ? "rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
                      : "rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm"
                  }
                >
                  {m.content}
                </div>
                <div
                  className={`flex items-center gap-1 ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <span className="text-[10px] text-muted-foreground">
                    {formatTime(m.createdAt)}
                  </span>
                  {isOwn &&
                    (m.readAt ? (
                      <CheckCheck className="h-3 w-3 text-primary" />
                    ) : (
                      <Check className="h-3 w-3 text-muted-foreground" />
                    ))}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

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
    </div>
  );
}
