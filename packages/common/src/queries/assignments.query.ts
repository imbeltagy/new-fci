"use client";

import { useQuery } from "@tanstack/react-query";

import { getAssignments } from "../actions/assignments.action";

export const ASSIGNMENT_KEYS = {
  all: ["assignments"] as const,
  forUser: (userId: string) => ["assignments", "user", userId] as const,
};

export function useAssignmentsQuery(userId: string) {
  return useQuery({
    queryKey: ASSIGNMENT_KEYS.forUser(userId),
    queryFn: () => getAssignments(userId),
    enabled: !!userId,
  });
}
