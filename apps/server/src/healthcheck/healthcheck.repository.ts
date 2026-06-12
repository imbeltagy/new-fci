import mongoose from "mongoose";

import { getRedisClient } from "../db/redis";

export class HealthcheckRepository {
  async pingMongo(): Promise<boolean> {
    try {
      if (!mongoose.connection.db) return false;
      await mongoose.connection.db.admin().command({ ping: 1 });
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
