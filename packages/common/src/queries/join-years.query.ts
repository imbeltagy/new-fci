"use client";

import { useQuery } from "@tanstack/react-query";

import { getJoinYear, listJoinYears } from "../actions/join-years.action";

export const JOIN_YEAR_KEYS = {
  all: ["joinYears"] as const,
  list: () => ["joinYears", "list"] as const,
  detail: (id: string) => ["joinYears", "detail", id] as const,
};

export function useListJoinYearsQuery() {
  return useQuery({
    queryKey: JOIN_YEAR_KEYS.list(),
    queryFn: listJoinYears,
  });
}

export function useGetJoinYearQuery(id: string) {
  return useQuery({
    queryKey: JOIN_YEAR_KEYS.detail(id),
    queryFn: () => getJoinYear(id),
    enabled: !!id,
  });
}
