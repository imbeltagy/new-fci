"use client";

import { useQuery } from "@tanstack/react-query";

import { getMe, getUser, listUsers } from "../actions/users.action";
import type { ListUsersFilter } from "../types/user";

export const USER_KEYS = {
  all: ["users"] as const,
  list: (filter?: ListUsersFilter) => ["users", "list", filter] as const,
  detail: (id: string) => ["users", "detail", id] as const,
  me: () => ["users", "me"] as const,
};

export function useListUsersQuery(filter?: ListUsersFilter) {
  return useQuery({
    queryKey: USER_KEYS.list(filter),
    queryFn: () => listUsers(filter),
  });
}

export function useGetUserQuery(id: string) {
  return useQuery({
    queryKey: USER_KEYS.detail(id),
    queryFn: () => getUser(id),
    enabled: !!id,
  });
}

export function useGetMeQuery() {
  return useQuery({
    queryKey: USER_KEYS.me(),
    queryFn: getMe,
  });
}
