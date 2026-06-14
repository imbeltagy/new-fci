"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { createComment, deleteComment } from "@repo/common/actions/rooms.action";
import { Button } from "@repo/common/components/ui/button";
import { Input } from "@repo/common/components/ui/input";
import type { PostComment } from "@repo/common/types/post";

export interface CommentTreeNode extends PostComment {
  children: CommentTreeNode[];
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

interface CommentNodeProps {
  node: CommentTreeNode;
  roomId: string;
  postId: string;
  currentUserId?: string;
  depth: number;
  onChanged: () => void;
}

export function CommentNode({
  node,
  roomId,
  postId,
  currentUserId,
  depth,
  onChanged,
}: CommentNodeProps) {
  const [replying, setReplying] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const canDelete = !node.deleted && node.author?.id === currentUserId;
  // Cap visual indentation so deep threads stay readable on mobile.
  const indented = depth > 0 && depth <= 5;

  async function submitReply() {
    const content = draft.trim();
    if (!content || busy) return;
    setBusy(true);
    const res = await createComment(roomId, postId, { content, parentId: node.id });
    setBusy(false);
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    setDraft("");
    setReplying(false);
    onChanged();
  }

  async function handleDelete() {
    const res = await deleteComment(roomId, postId, node.id);
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    onChanged();
  }

  return (
    <div className={indented ? "ml-3 border-l pl-3" : ""}>
      {node.deleted ? (
        <p className="py-1 text-xs italic text-muted-foreground">[deleted]</p>
      ) : (
        <div className="py-1">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
              {node.author?.avatarUrl ? (
                <img src={node.author.avatarUrl} alt={node.author.name} className="h-full w-full object-cover" />
              ) : (
                node.author ? initials(node.author.name) : ""
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">{node.author?.name}</span>
                {node.author?.isStaff && (
                  <span className="rounded bg-primary/10 px-1 py-0.5 text-[9px] font-medium text-primary">
                    Faculty
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground">{timeAgo(node.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm">{node.content}</p>
              <div className="flex items-center gap-3 pt-0.5">
                <button
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => setReplying((v) => !v)}
                >
                  Reply
                </button>
                {canDelete && (
                  <button
                    className="text-muted-foreground hover:text-destructive"
                    onClick={handleDelete}
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {replying && (
            <div className="mt-2 flex gap-2 pl-9">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitReply();
                  }
                }}
                placeholder="Write a reply..."
                className="h-8 text-sm"
              />
              <Button size="sm" className="h-8" onClick={submitReply} disabled={busy || !draft.trim()}>
                Reply
              </Button>
            </div>
          )}
        </div>
      )}

      {node.children.map((child) => (
        <CommentNode
          key={child.id}
          node={child}
          roomId={roomId}
          postId={postId}
          currentUserId={currentUserId}
          depth={depth + 1}
          onChanged={onChanged}
        />
      ))}
    </div>
  );
}
