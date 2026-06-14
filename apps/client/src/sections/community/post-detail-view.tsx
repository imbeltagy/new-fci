"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, Send, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createComment,
  deletePost,
  likePost,
  unlikePost,
} from "@repo/common/actions/rooms.action";
import { Button } from "@repo/common/components/ui/button";
import { Input } from "@repo/common/components/ui/input";
import { useRoomFeed } from "@repo/common/hooks/use-room-feed";
import {
  ROOM_KEYS,
  usePostCommentsQuery,
  usePostQuery,
} from "@repo/common/queries/rooms.query";
import { useAuthStore } from "@repo/common/stores/auth.store";
import { cn } from "@repo/common/lib/utils";
import type { Post, PostComment } from "@repo/common/types/post";
import { CommentNode, type CommentTreeNode } from "./comment-node";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function buildTree(comments: PostComment[]): CommentTreeNode[] {
  const map = new Map<string, CommentTreeNode>();
  comments.forEach((c) => map.set(c.id, { ...c, children: [] }));
  const roots: CommentTreeNode[] = [];
  comments.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) map.get(c.parentId)!.children.push(node);
    else roots.push(node);
  });
  return roots;
}

export function PostDetailView({ roomId, postId }: { roomId: string; postId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const { data: postData } = usePostQuery(roomId, postId);
  const { data: commentsData, isPending: commentsLoading } = usePostCommentsQuery(roomId, postId);

  const [post, setPost] = useState<Post | null>(null);
  const postSeeded = useRef(false);

  useEffect(() => {
    if (postData?.data && !postSeeded.current) {
      postSeeded.current = true;
      setPost(postData.data.post);
    }
  }, [postData]);

  const comments = commentsData?.data?.comments ?? [];
  const tree = useMemo(() => buildTree(comments), [comments]);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  function refreshComments() {
    queryClient.invalidateQueries({ queryKey: ROOM_KEYS.comments(roomId, postId) });
  }

  useRoomFeed(roomId, {
    onLike: (e) => {
      if (e.postId === postId) setPost((p) => (p ? { ...p, likeCount: e.likeCount } : p));
    },
    onComment: (e) => {
      if (e.postId === postId) {
        setPost((p) => (p ? { ...p, commentCount: e.commentCount } : p));
        refreshComments();
      }
    },
    onDeleted: (e) => {
      if (e.postId === postId) {
        toast.info("This post was removed.");
        router.push(`/community/${roomId}`);
      }
    },
  });

  async function toggleLike() {
    if (!post) return;
    const res = post.likedByMe
      ? await unlikePost(roomId, post.id)
      : await likePost(roomId, post.id);
    if (!res.success || !res.data) {
      toast.error(res.message);
      return;
    }
    setPost({ ...post, likeCount: res.data.likeCount, likedByMe: res.data.likedByMe });
  }

  async function handleDeletePost() {
    const res = await deletePost(roomId, postId);
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    router.push(`/community/${roomId}`);
  }

  async function submitComment() {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    const res = await createComment(roomId, postId, { content });
    setSending(false);
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    setDraft("");
    setPost((p) => (p ? { ...p, commentCount: p.commentCount + 1 } : p));
    refreshComments();
  }

  return (
    <div className="fixed inset-x-0 top-0 bottom-16 z-40 flex flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-card px-3">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/community/${roomId}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <p className="flex-1 font-semibold">Post</p>
      </header>

      <div className="flex-1 overflow-y-auto">
        {post && (
          <article
            className={cn("space-y-3 border-b p-4", post.isStaff && "border-l-2 border-l-primary")}
          >
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
              </div>
              {post.author.id === currentUserId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={handleDeletePost}
                  title="Delete post"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {post.content && (
              <p className="whitespace-pre-wrap break-words text-sm">{post.content}</p>
            )}
            {post.imageUrl && (
              <img src={post.imageUrl} alt="" className="w-full rounded-lg object-contain bg-muted" />
            )}

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="gap-1.5 px-2" onClick={toggleLike}>
                <Heart className={cn("h-4 w-4", post.likedByMe && "fill-red-500 text-red-500")} />
                <span className="text-xs">{post.likeCount}</span>
              </Button>
              <span className="px-2 text-xs text-muted-foreground">
                {post.commentCount} comments
              </span>
            </div>
          </article>
        )}

        <div className="space-y-1 p-3">
          {commentsLoading && <p className="text-sm text-muted-foreground">Loading comments...</p>}
          {!commentsLoading && tree.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No comments yet. Start the conversation.
            </p>
          )}
          {tree.map((node) => (
            <CommentNode
              key={node.id}
              node={node}
              roomId={roomId}
              postId={postId}
              currentUserId={currentUserId}
              depth={0}
              onChanged={refreshComments}
            />
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t bg-card p-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submitComment();
            }
          }}
          placeholder="Write a comment..."
        />
        <Button size="icon" onClick={submitComment} disabled={sending || !draft.trim()}>
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
