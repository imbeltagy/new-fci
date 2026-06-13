"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getMySubjects,
  getSubjectDetail,
  getSubjectEnrollments,
  getSubjectStaff,
  listSubjects,
} from "../actions/subjects.action";
import type { ListSubjectsFilter } from "../types/subject";

export const SUBJECT_KEYS = {
  all: ["subjects"] as const,
  list: (filter?: ListSubjectsFilter) => ["subjects", "list", filter] as const,
  staff: (id: string) => ["subjects", "staff", id] as const,
  enrollments: (id: string) => ["subjects", "enrollments", id] as const,
  detail: (id: string) => ["subjects", "detail", id] as const,
  mine: () => ["subjects", "mine"] as const,
};

export function useListSubjectsQuery(filter?: ListSubjectsFilter) {
  return useQuery({
    queryKey: SUBJECT_KEYS.list(filter),
    queryFn: () => listSubjects(filter),
  });
}

export function useSubjectStaffQuery(subjectId: string) {
  return useQuery({
    queryKey: SUBJECT_KEYS.staff(subjectId),
    queryFn: () => getSubjectStaff(subjectId),
    enabled: !!subjectId,
  });
}

export function useSubjectEnrollmentsQuery(subjectId: string) {
  return useQuery({
    queryKey: SUBJECT_KEYS.enrollments(subjectId),
    queryFn: () => getSubjectEnrollments(subjectId),
    enabled: !!subjectId,
  });
}

export function useMySubjectsQuery() {
  return useQuery({
    queryKey: SUBJECT_KEYS.mine(),
    queryFn: getMySubjects,
  });
}

export function useSubjectDetailQuery(subjectId: string) {
  return useQuery({
    queryKey: SUBJECT_KEYS.detail(subjectId),
    queryFn: () => getSubjectDetail(subjectId),
    enabled: !!subjectId,
  });
}
