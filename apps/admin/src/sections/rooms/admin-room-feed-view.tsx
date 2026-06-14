"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MicOff, Volume2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  deletePost,
  getRoomPosts,
  muteRoomUser,
  unmuteRoomUser,
} from "@repo/common/actions/rooms.action";
import { Button } from "@repo/common/components/ui/button";
import { Separator } from "@repo/common/components/ui/separator";
import {
  ROOM_KEYS,
  useRoomMutesQuery,
  useRoomPostsQuery,
  useRoomQuery,
} from "@repo/common/queries/rooms.query";
import type { Post } from "@repo/common/types/post";
import { PageHeader } from "@/components/control-panel/page-header";

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function AdminRoomFeedView({ roomId }: { roomId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: roomData } = useRoomQuery(roomId);
  const { data: initial, isPending } = useRoomPostsQuery(roomId);
  const { data: mutesData } = useRoomMutesQuery(roomId);

  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const seededRef = useRef(false);

  useEffect(() => {
    if (initial?.data && !seededRef.current) {
      seededRef.current = true;
      setPosts(initial.data.posts);
      setCursor(initial.data.nextCursor);
      setHasMore(initial.data.hasMore);
    }
  }, [initial]);

  const mutes = mutesData?.data?.mutes ?? [];
  const mutedIds = new Set(mutes.map((m) => m.userId));

  const room = roomData?.data?.room;

  function invalidateMutes() {
    queryClient.invalidateQueries({ queryKey: ROOM_KEYS.mutes(roomId) });
  }

  async function handleDelete(postId: string) {
    const res = await deletePost(roomId, postId);
    if (!res.success) return toast.error(res.message);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    toast.success("Post deleted.");
  }

  async function handleMute(userId: string) {
    const res = await muteRoomUser(roomId, userId);
    if (!res.success) return toast.error(res.message);
    toast.success("User muted.");
    invalidateMutes();
  }

  async function handleUnmute(userId: string) {
    const res = await unmuteRoomUser(roomId, userId);
    if (!res.success) return toast.error(res.message);
    toast.success("User unmuted.");
    invalidateMutes();
  }

  async function loadOlder() {
    if (!cursor || loadingOlder) return;
    setLoadingOlder(true);
    const res = await getRoomPosts(roomId, { before: cursor });
    if (res.success && res.data) {
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...res.data!.posts.filter((p) => !seen.has(p.id))];
      });
      setCursor(res.data.nextCursor);
      setHasMore(res.data.hasMore);
    }
    setLoadingOlder(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={room?.name ?? "Room Feed"}
        breadcrumbs={[
          { label: "Control Panel", href: "/" },
          { label: "Rooms", href: "/rooms" },
          { label: room?.name ?? "Feed" },
        ]}
      />

      {mutes.length > 0 && (
        <>
          <div className="space-y-2">
            <p className="text-sm font-semibold">Muted users</p>
            {mutes.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-sm">
                <span>
                  {m.user.name}{" "}
                  <span className="text-muted-foreground">({m.user.email})</span>
                </span>
                <Button variant="ghost" size="sm" onClick={() => handleUnmute(m.userId)}>
                  <Volume2 className="mr-1 h-3.5 w-3.5" />
                  Unmute
                </Button>
              </div>
            ))}
          </div>
          <Separator />
        </>
      )}

      <div className="space-y-3">
        {isPending && <p className="text-sm text-muted-foreground">Loading...</p>}
        {!isPending && posts.length === 0 && (
          <p className="text-sm text-muted-foreground">No posts yet.</p>
        )}

        {posts.map((post) => (
          <div
            key={post.id}
            className={`rounded-lg border bg-card p-4 space-y-3 ${post.isStaff ? "border-l-4 border-l-primary" : ""}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm">
                  <span className="font-semibold">{post.author.name}</span>
                  {post.isStaff && (
                    <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                      Faculty
                    </span>
                  )}
                  <span className="ml-2 text-xs text-muted-foreground">{timeAgo(post.createdAt)}</span>
                </p>
                {post.content && (
                  <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                    {post.content}
                  </p>
                )}
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt=""
                    className="max-h-64 rounded-lg object-contain bg-muted"
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  {post.likeCount} likes · {post.commentCount} comments
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/rooms/${roomId}/posts/${post.id}`)}
                >
                  View
                </Button>
                {!mutedIds.has(post.author.id) && (
                  <Button variant="ghost" size="sm" onClick={() => handleMute(post.author.id)} title="Mute author">
                    <MicOff className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(post.id)}
                  title="Delete"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}

        {hasMore && (
          <div className="flex justify-center pt-2">
            <Button variant="outline" size="sm" onClick={loadOlder} disabled={loadingOlder}>
              {loadingOlder ? "Loading..." : "Load older posts"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
