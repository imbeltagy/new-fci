import { HealthcheckRepository } from "./healthcheck.repository";

export interface HealthcheckStatus {
  status: "ok" | "degraded";
  timestamp: string;
  uptime: number;
  services: {
    postgres: "up" | "down";
    redis: "up" | "down";
  };
}

export class HealthcheckService {
  constructor(private readonly repository = new HealthcheckRepository()) {}

  async getStatus(): Promise<HealthcheckStatus> {
    const [postgresUp, redisUp] = await Promise.all([
      this.repository.pingPostgres(),
      this.repository.pingRedis(),
    ]);

    return {
      status: postgresUp && redisUp ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        postgres: postgresUp ? "up" : "down",
        redis: redisUp ? "up" : "down",
      },
    };
  }
}
