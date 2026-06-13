"use client";

import { useQuery } from "@tanstack/react-query";

import { getGroup, listGroups } from "../actions/access-groups.action";

export const ACCESS_GROUP_KEYS = {
  all: ["access-groups"] as const,
  list: () => ["access-groups", "list"] as const,
  detail: (id: string) => ["access-groups", "detail", id] as const,
};

export function useListGroupsQuery() {
  return useQuery({
    queryKey: ACCESS_GROUP_KEYS.list(),
    queryFn: listGroups,
  });
}

export function useGetGroupQuery(id: string) {
  return useQuery({
    queryKey: ACCESS_GROUP_KEYS.detail(id),
    queryFn: () => getGroup(id),
    enabled: !!id,
  });
}
