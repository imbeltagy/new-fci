"use client";

import { API_ROUTES } from "../constants/api";
import { api } from "../lib/api-client";
import type { AssignMajorBody, StaffAssignments } from "../types/assignment";

export async function getAssignments(userId: string) {
  return api.get<StaffAssignments>(API_ROUTES.assignments.get(userId));
}

export async function assignJoinYear(userId: string, joinYearId: string) {
  return api.post<unknown>(API_ROUTES.assignments.assignJoinYear(userId, joinYearId), {});
}

export async function removeJoinYear(userId: string, joinYearId: string) {
  return api.delete<null>(API_ROUTES.assignments.removeJoinYear(userId, joinYearId));
}

export async function assignMajor(userId: string, body: AssignMajorBody) {
  return api.post<unknown>(API_ROUTES.assignments.assignMajor(userId), body);
}

export async function removeMajor(userId: string, majorId: string, joinYearId: string) {
  return api.delete<null>(API_ROUTES.assignments.removeMajor(userId, majorId, joinYearId));
}

export async function assignSubject(userId: string, subjectId: string) {
  return api.post<unknown>(API_ROUTES.assignments.assignSubject(userId, subjectId), {});
}

export async function removeSubject(userId: string, subjectId: string) {
  return api.delete<null>(API_ROUTES.assignments.removeSubject(userId, subjectId));
}
