"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Pin, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deletePost,
  likePost,
  pinPost,
  unlikePost,
  unpinPost,
} from "@repo/common/actions/rooms.action";
import { Button } from "@repo/common/components/ui/button";
import { cn } from "@repo/common/lib/utils";
import type { Post } from "@repo/common/types/post";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

interface PostCardProps {
  post: Post;
  roomId: string;
  currentUserId?: string;
  isFaculty: boolean;
  onChanged: (post: Post) => void;
  onDeleted: (postId: string) => void;
}

export function PostCard({
  post,
  roomId,
  currentUserId,
  isFaculty,
  onChanged,
  onDeleted,
}: PostCardProps) {
  const router = useRouter();
  const canDelete = currentUserId === post.author.id;

  function openDetail() {
    router.push(`/community/${roomId}/posts/${post.id}`);
  }

  async function toggleLike() {
    const res = post.likedByMe
      ? await unlikePost(roomId, post.id)
      : await likePost(roomId, post.id);
    if (!res.success || !res.data) {
      toast.error(res.message);
      return;
    }
    onChanged({ ...post, likeCount: res.data.likeCount, likedByMe: res.data.likedByMe });
  }

  async function togglePin() {
    const res = post.isPinned
      ? await unpinPost(roomId, post.id)
      : await pinPost(roomId, post.id);
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    onChanged({ ...post, isPinned: !post.isPinned });
  }

  async function handleDelete() {
    const res = await deletePost(roomId, post.id);
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    onDeleted(post.id);
  }

  return (
    <article
      className={cn(
        "space-y-3 rounded-lg border bg-card p-4",
        post.isStaff && "border-l-2 border-l-primary",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/users/${encodeURIComponent(post.author.email)}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold text-muted-foreground"
        >
          {post.author.avatarUrl ? (
            <img src={post.author.avatarUrl} alt={post.author.name} className="h-full w-full object-cover" />
          ) : (
            initials(post.author.name)
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/users/${encodeURIComponent(post.author.email)}`}
              className="truncate text-sm font-semibold hover:underline"
            >
              {post.author.name}
            </Link>
            {post.isStaff && (
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                Faculty
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</span>
        </div>
        {post.isPinned && <Pin className="h-4 w-4 fill-primary text-primary" />}
      </div>

      {/* Body */}
      {post.content && (
        <p className="whitespace-pre-wrap break-words text-sm" onClick={openDetail}>
          {post.content}
        </p>
      )}
      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt=""
          className="max-h-96 w-full rounded-lg object-contain bg-muted"
          onClick={openDetail}
        />
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 text-muted-foreground">
        <Button variant="ghost" size="sm" className="gap-1.5 px-2" onClick={toggleLike}>
          <Heart
            className={cn("h-4 w-4", post.likedByMe && "fill-red-500 text-red-500")}
          />
          <span className="text-xs">{post.likeCount}</span>
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5 px-2" onClick={openDetail}>
          <MessageCircle className="h-4 w-4" />
          <span className="text-xs">{post.commentCount}</span>
        </Button>

        <div className="ml-auto flex items-center gap-1">
          {isFaculty && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={togglePin}
              title={post.isPinned ? "Unpin" : "Pin"}
            >
              <Pin className={cn("h-4 w-4", post.isPinned && "fill-primary text-primary")} />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={handleDelete}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
