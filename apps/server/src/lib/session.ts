import { randomBytes, randomUUID } from "crypto";

import { getRedisClient } from "../db/redis";

export interface AdminSession {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
}

const sessionKey = (id: string) => `session:${id}`;
const userSessionsKey = (userId: string) => `user_sessions:${userId}`;

export const createAdminSession = async (
  userId: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: number, // unix timestamp
): Promise<{ sessionId: string; csrfToken: string }> => {
  const redis = getRedisClient();
  const sessionId = randomUUID();
  const csrfToken = randomBytes(32).toString("hex");
  const ttl = expiresAt - Math.floor(Date.now() / 1000);

  await redis.set(
    sessionKey(sessionId),
    JSON.stringify({ accessToken, refreshToken, csrfToken } satisfies AdminSession),
    "EX",
    ttl,
  );

  await redis.sadd(userSessionsKey(userId), sessionId);
  // TTL of user_sessions = TTL of the last added session
  await redis.expireat(userSessionsKey(userId), expiresAt);

  return { sessionId, csrfToken };
};

export const getAdminSession = async (
  sessionId: string,
): Promise<AdminSession | null> => {
  const raw = await getRedisClient().get(sessionKey(sessionId));
  return raw ? (JSON.parse(raw) as AdminSession) : null;
};

export const updateAdminSessionAccessToken = async (
  sessionId: string,
  newAccessToken: string,
): Promise<void> => {
  const redis = getRedisClient();
  const ttl = await redis.ttl(sessionKey(sessionId));
  if (ttl <= 0) return;

  const raw = await redis.get(sessionKey(sessionId));
  if (!raw) return;

  const session = JSON.parse(raw) as AdminSession;
  await redis.set(
    sessionKey(sessionId),
    JSON.stringify({ ...session, accessToken: newAccessToken }),
    "EX",
    ttl,
  );
};

export const deleteAdminSession = async (
  sessionId: string,
  userId: string,
): Promise<void> => {
  const redis = getRedisClient();
  await redis.del(sessionKey(sessionId));
  await redis.srem(userSessionsKey(userId), sessionId);
};

export const deleteUserSessions = async (userIds: string[]): Promise<void> => {
  if (userIds.length === 0) return;
  const redis = getRedisClient();

  for (const userId of userIds) {
    const sessionIds = await redis.smembers(userSessionsKey(userId));
    if (sessionIds.length > 0) {
      await redis.del(...sessionIds.map(sessionKey));
    }
    await redis.del(userSessionsKey(userId));
  }
};
