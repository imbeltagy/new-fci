"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getMe, getUser, listUsers, updateMe } from "../actions/users.action";
import type { ListUsersFilter, UpdateMeBody } from "../types/user";

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

export function useUpdateMeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateMeBody) => updateMe(body),
    onSuccess: (result) => {
      if (result.success && result.data) {
        queryClient.setQueryData(USER_KEYS.me(), result);
      }
      queryClient.invalidateQueries({ queryKey: USER_KEYS.me() });
    },
  });
}
