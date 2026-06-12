import { getPrismaClient } from "../db/postgres";
import { getRedisClient } from "../db/redis";

export class HealthcheckRepository {
  async pingPostgres(): Promise<boolean> {
    try {
      await getPrismaClient().$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  async pingRedis(): Promise<boolean> {
    try {
      return (await getRedisClient().ping()) === "PONG";
    } catch {
      return false;
    }
  }
}
