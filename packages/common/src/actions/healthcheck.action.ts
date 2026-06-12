import { env } from "../configs/env";
import { API_ROUTES } from "../constants/api";
import type { HealthcheckResponse } from "../types/healthcheck";

export const getHealthcheck = async (): Promise<HealthcheckResponse> => {
  const response = await fetch(`${env.apiBaseUrl}${API_ROUTES.healthcheck}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Healthcheck request failed with status ${response.status}`);
  }

  return response.json();
};
