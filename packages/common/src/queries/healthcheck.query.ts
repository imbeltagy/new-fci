"use client";

import { useQuery } from "@tanstack/react-query";

import { getHealthcheck } from "../actions/healthcheck.action";

export const healthcheckKeys = {
  all: ["healthcheck"] as const,
};

export const useHealthcheckQuery = () =>
  useQuery({
    queryKey: healthcheckKeys.all,
    queryFn: getHealthcheck,
    retry: 1,
  });
