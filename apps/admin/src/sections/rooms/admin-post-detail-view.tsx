"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { MicOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteComment,
  deletePost,
  muteRoomUser,
} from "@repo/common/actions/rooms.action";
import { Button } from "@repo/common/components/ui/button";
import {
  usePostCommentsQuery,
  usePostQuery,
} from "@repo/common/queries/rooms.query";
import type { PostComment } from "@repo/common/types/post";
import { PageHeader } from "@/components/control-panel/page-header";
import { useQueryClient } from "@tanstack/react-query";
import { ROOM_KEYS } from "@repo/common/queries/rooms.query";

interface CommentTreeNode extends PostComment {
  children: CommentTreeNode[];
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

function CommentNode({
  node,
  depth,
  roomId,
  postId,
  onChanged,
}: {
  node: CommentTreeNode;
  depth: number;
  roomId: string;
  postId: string;
  onChanged: () => void;
}) {
  const indented = depth > 0 && depth <= 5;

  async function handleDelete() {
    const res = await deleteComment(roomId, postId, node.id);
    if (!res.success) return toast.error(res.message);
    toast.success("Comment deleted.");
    onChanged();
  }

  async function handleMute() {
    if (!node.author) return;
    const res = await muteRoomUser(roomId, node.author.id);
    if (!res.success) return toast.error(res.message);
    toast.success("User muted.");
  }

  return (
    <div className={indented ? "ml-4 border-l pl-4" : ""}>
      {node.deleted ? (
        <p className="py-1 text-xs italic text-muted-foreground">[deleted]</p>
      ) : (
        <div className="flex items-start justify-between gap-2 py-1">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold">
              {node.author?.name}
              {node.author?.isStaff && (
                <span className="ml-1 rounded bg-primary/10 px-1 py-0.5 text-[9px] text-primary">
                  Faculty
                </span>
              )}
            </p>
            <p className="break-words text-sm">{node.content}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            {node.author && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleMute} title="Mute author">
                <MicOff className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={handleDelete}
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
      {node.children.map((child) => (
        <CommentNode
          key={child.id}
          node={child}
          depth={depth + 1}
          roomId={roomId}
          postId={postId}
          onChanged={onChanged}
        />
      ))}
    </div>
  );
}

export function AdminPostDetailView({ roomId, postId }: { roomId: string; postId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: postData, isPending: postPending } = usePostQuery(roomId, postId);
  const { data: commentsData, isPending: commentsPending } = usePostCommentsQuery(roomId, postId);

  const post = postData?.data?.post;
  const comments = commentsData?.data?.comments ?? [];
  const tree = useMemo(() => buildTree(comments), [comments]);

  function refreshComments() {
    queryClient.invalidateQueries({ queryKey: ROOM_KEYS.comments(roomId, postId) });
  }

  async function handleDeletePost() {
    const res = await deletePost(roomId, postId);
    if (!res.success) return toast.error(res.message);
    toast.success("Post deleted.");
    router.push(`/rooms/${roomId}`);
  }

  async function handleMuteAuthor() {
    if (!post) return;
    const res = await muteRoomUser(roomId, post.author.id);
    if (!res.success) return toast.error(res.message);
    toast.success("Author muted.");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Post Detail"
        breadcrumbs={[
          { label: "Control Panel", href: "/" },
          { label: "Rooms", href: "/rooms" },
          { label: "Feed", href: `/rooms/${roomId}` },
          { label: "Post" },
        ]}
      />

      {postPending && <p className="text-sm text-muted-foreground">Loading...</p>}

      {post && (
        <div className={`rounded-lg border bg-card p-4 space-y-3 ${post.isStaff ? "border-l-4 border-l-primary" : ""}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-sm font-semibold">
                {post.author.name}
                {post.isStaff && (
                  <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                    Faculty
                  </span>
                )}
              </p>
              {post.content && (
                <p className="whitespace-pre-wrap break-words text-sm">{post.content}</p>
              )}
              {post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt=""
                  className="max-h-96 rounded-lg object-contain bg-muted"
                />
              )}
              <p className="text-xs text-muted-foreground">
                {post.likeCount} likes · {post.commentCount} comments
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              <Button variant="ghost" size="sm" onClick={handleMuteAuthor}>
                <MicOff className="mr-1 h-3.5 w-3.5" />
                Mute author
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleDeletePost}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Delete post
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-1 rounded-lg border bg-card p-4">
        <p className="mb-3 text-sm font-semibold">Comments</p>
        {commentsPending && <p className="text-sm text-muted-foreground">Loading...</p>}
        {!commentsPending && tree.length === 0 && (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        )}
        {tree.map((node) => (
          <CommentNode
            key={node.id}
            node={node}
            depth={0}
            roomId={roomId}
            postId={postId}
            onChanged={refreshComments}
          />
        ))}
      </div>
    </div>
  );
}
