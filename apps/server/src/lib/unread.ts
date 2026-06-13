import { getRedisClient } from "../db/redis";

/**
 * Per-room unread tracking, fully in Redis (O(1) per room, no DB counts).
 *
 *   room:msgcount:{roomId}        — total messages ever sent to the room
 *   room:read:{userId}:{roomId}   — msgcount snapshot at the user's last read
 *
 * unread = msgcount - read (clamped at 0).
 */
const msgCountKey = (roomId: string) => `room:msgcount:${roomId}`;
const readKey = (userId: string, roomId: string) => `room:read:${userId}:${roomId}`;

export async function incrRoomMessageCount(roomId: string): Promise<number> {
  return getRedisClient().incr(msgCountKey(roomId));
}

export async function markRoomRead(userId: string, roomId: string): Promise<void> {
  const redis = getRedisClient();
  const count = (await redis.get(msgCountKey(roomId))) ?? "0";
  await redis.set(readKey(userId, roomId), count);
}

export async function getRoomUnreadCounts(
  userId: string,
  roomIds: string[],
): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  if (roomIds.length === 0) return result;

  const redis = getRedisClient();
  const pipeline = redis.pipeline();
  for (const roomId of roomIds) {
    pipeline.get(msgCountKey(roomId));
    pipeline.get(readKey(userId, roomId));
  }
  const replies = await pipeline.exec();

  roomIds.forEach((roomId, i) => {
    const total = Number((replies?.[i * 2]?.[1] as string | null) ?? "0");
    const read = Number((replies?.[i * 2 + 1]?.[1] as string | null) ?? "0");
    result[roomId] = Math.max(0, total - read);
  });

  return result;
}
