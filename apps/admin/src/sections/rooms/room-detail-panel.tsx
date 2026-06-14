"use client";

import { MicOff, Trash2, Volume2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  deletePost,
  muteRoomUser,
  unmuteRoomUser,
} from "@repo/common/actions/rooms.action";
import { Button } from "@repo/common/components/ui/button";
import { Separator } from "@repo/common/components/ui/separator";
import {
  ROOM_KEYS,
  useRoomMutesQuery,
  useRoomPostsQuery,
} from "@repo/common/queries/rooms.query";
import type { Room } from "@repo/common/types/room";

interface RoomDetailPanelProps {
  room: Room;
}

export function RoomDetailPanel({ room }: RoomDetailPanelProps) {
  const queryClient = useQueryClient();

  const { data: postsData, isPending } = useRoomPostsQuery(room.id);
  const { data: mutesData } = useRoomMutesQuery(room.id);

  const posts = postsData?.data?.posts ?? [];
  const mutes = mutesData?.data?.mutes ?? [];
  const mutedIds = new Set(mutes.map((m) => m.userId));

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ROOM_KEYS.posts(room.id) });
    queryClient.invalidateQueries({ queryKey: ROOM_KEYS.mutes(room.id) });
  }

  async function handleDelete(postId: string) {
    const res = await deletePost(room.id, postId);
    if (!res.success) return toast.error(res.message);
    toast.success("Post deleted.");
    invalidate();
  }

  async function handleMute(userId: string) {
    const res = await muteRoomUser(room.id, userId);
    if (!res.success) return toast.error(res.message);
    toast.success("User muted.");
    invalidate();
  }

  async function handleUnmute(userId: string) {
    const res = await unmuteRoomUser(room.id, userId);
    if (!res.success) return toast.error(res.message);
    toast.success("User unmuted.");
    invalidate();
  }

  return (
    <div className="space-y-5">
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

      <div className="space-y-2">
        <p className="text-sm font-semibold">Recent posts</p>
        {isPending && <p className="text-sm text-muted-foreground">Loading...</p>}
        {!isPending && posts.length === 0 && (
          <p className="text-sm text-muted-foreground">No posts yet.</p>
        )}
        <div className="max-h-[50vh] space-y-2 overflow-y-auto">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-start justify-between gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0 space-y-1">
                <p className="text-sm">
                  <span className="font-medium">{post.author.name}</span>
                  {post.isStaff && (
                    <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                      Faculty
                    </span>
                  )}
                </p>
                {post.content && (
                  <p className="break-words text-sm text-muted-foreground">{post.content}</p>
                )}
                {post.imageUrl && (
                  <img src={post.imageUrl} alt="" className="max-h-32 rounded" />
                )}
                <p className="text-xs text-muted-foreground">
                  {post.likeCount} likes · {post.commentCount} comments
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                {!mutedIds.has(post.author.id) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Mute author"
                    onClick={() => handleMute(post.author.id)}
                  >
                    <MicOff className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  title="Delete post"
                  onClick={() => handleDelete(post.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
