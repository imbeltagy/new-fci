import Redis from "ioredis";

let redisClient: Redis | null = null;

export const connectRedis = async (): Promise<Redis> => {
  const url = process.env.REDIS_URL;

  if (!url) {
    throw new Error("REDIS_URL is not defined");
  }

  console.log("Connecting to Redis...");
  redisClient = new Redis(url, { lazyConnect: true });
  await redisClient.connect();
  console.log("Redis connected");

  return redisClient;
};

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    throw new Error("Redis client is not connected. Call connectRedis() first.");
  }

  return redisClient;
};
