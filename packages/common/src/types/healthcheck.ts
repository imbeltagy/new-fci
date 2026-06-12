export interface HealthcheckResponse {
  status: "ok" | "degraded";
  timestamp: string;
  uptime: number;
  services: {
    mongo: "up" | "down";
    redis: "up" | "down";
  };
}
