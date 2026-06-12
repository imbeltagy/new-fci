export interface HealthcheckResponse {
  status: "ok" | "degraded";
  timestamp: string;
  uptime: number;
  services: {
    postgres: "up" | "down";
    redis: "up" | "down";
  };
}
