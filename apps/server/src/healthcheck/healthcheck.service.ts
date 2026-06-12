import { HealthcheckRepository } from "./healthcheck.repository";

export interface HealthcheckStatus {
  status: "ok" | "degraded";
  timestamp: string;
  uptime: number;
  services: {
    mongo: "up" | "down";
    redis: "up" | "down";
  };
}

export class HealthcheckService {
  constructor(private readonly repository = new HealthcheckRepository()) {}

  async getStatus(): Promise<HealthcheckStatus> {
    const [mongoUp, redisUp] = await Promise.all([
      this.repository.pingMongo(),
      this.repository.pingRedis(),
    ]);

    return {
      status: mongoUp && redisUp ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        mongo: mongoUp ? "up" : "down",
        redis: redisUp ? "up" : "down",
      },
    };
  }
}
