"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pin, Plus } from "lucide-react";

import { getRoomPosts } from "@repo/common/actions/rooms.action";
import { Button } from "@repo/common/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/common/components/ui/dialog";
import { useRoomFeed } from "@repo/common/hooks/use-room-feed";
import {
  useRoomPinsQuery,
  useRoomPostsQuery,
  useRoomQuery,
} from "@repo/common/queries/rooms.query";
import { useAuthStore } from "@repo/common/stores/auth.store";
import type { Post } from "@repo/common/types/post";
import { PostCard } from "./post-card";
import { PostComposer } from "./post-composer";

export function RoomFeedView({ roomId }: { roomId: string }) {
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const role = useAuthStore((s) => s.user?.role);
  const isFaculty = role === "teacher" || role === "sub_teacher";

  const { data: roomData } = useRoomQuery(roomId);
  const { data: initial } = useRoomPostsQuery(roomId);

  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [pinsOpen, setPinsOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const seededRef = useRef(false);

  const { data: pinsData } = useRoomPinsQuery(roomId, pinsOpen);
  const pins = pinsData?.data?.pins ?? [];

  useEffect(() => {
    if (initial?.data && !seededRef.current) {
      seededRef.current = true;
      setPosts(initial.data.posts);
      setCursor(initial.data.nextCursor);
      setHasMore(initial.data.hasMore);
    }
  }, [initial]);

  useRoomFeed(roomId, {
    onNewPost: (p) =>
      setPosts((prev) => (prev.some((x) => x.id === p.id) ? prev : [p, ...prev])),
    onLike: (e) =>
      setPosts((prev) =>
        prev.map((p) => (p.id === e.postId ? { ...p, likeCount: e.likeCount } : p)),
      ),
    onComment: (e) =>
      setPosts((prev) =>
        prev.map((p) => (p.id === e.postId ? { ...p, commentCount: e.commentCount } : p)),
      ),
    onDeleted: (e) => setPosts((prev) => prev.filter((p) => p.id !== e.postId)),
  });

  function handleChanged(updated: Post) {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }
  function handleDeleted(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }
  function handleCreated(post: Post) {
    setPosts((prev) => (prev.some((x) => x.id === post.id) ? prev : [post, ...prev]));
    setComposeOpen(false);
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

  const room = roomData?.data?.room;

  return (
    <div className="fixed inset-x-0 top-0 bottom-16 z-40 flex flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-card px-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/community")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <p className="min-w-0 flex-1 truncate font-semibold">{room?.name ?? "Channel"}</p>
        <Button variant="ghost" size="icon" onClick={() => setPinsOpen(true)} title="Pinned posts">
          <Pin className="h-5 w-5" />
        </Button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
        {posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            roomId={roomId}
            currentUserId={currentUserId}
            isFaculty={isFaculty}
            onChanged={handleChanged}
            onDeleted={handleDeleted}
          />
        ))}

        {posts.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No posts yet. Be the first to share something.
          </p>
        )}

        {hasMore && (
          <div className="flex justify-center pb-4">
            <Button variant="outline" size="sm" onClick={loadOlder} disabled={loadingOlder}>
              {loadingOlder ? "Loading..." : "Load older posts"}
            </Button>
          </div>
        )}
      </div>

      {/* Floating compose button */}
      <button
        onClick={() => setComposeOpen(true)}
        className="absolute bottom-4 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="New post"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Compose dialog */}
      <Dialog open={composeOpen} onOpenChange={(v) => !v && setComposeOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Post</DialogTitle>
          </DialogHeader>
          <PostComposer roomId={roomId} onCreated={handleCreated} />
        </DialogContent>
      </Dialog>

      {/* Pins dialog */}
      <Dialog open={pinsOpen} onOpenChange={setPinsOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pinned posts</DialogTitle>
          </DialogHeader>
          {pins.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pinned posts.</p>
          ) : (
            <div className="space-y-2">
              {pins.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setPinsOpen(false);
                    router.push(`/community/${roomId}/posts/${p.id}`);
                  }}
                  className="block w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted"
                >
                  <p className="text-xs font-semibold">{p.author.name}</p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {p.content || "(image)"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
