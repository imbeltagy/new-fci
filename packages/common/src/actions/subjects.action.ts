"use client";

import { API_ROUTES } from "../constants/api";
import { api } from "../lib/api-client";
import type {
  CreateSubjectBody,
  ListSubjectsFilter,
  StaffMajorEntry,
  StaffSubjectEntry,
  StudentSubjectEntry,
  Subject,
  SubjectDetail,
  SubjectEnrollment,
  SubjectStaffMember,
  UpdateSubjectBody,
} from "../types/subject";

export async function listSubjects(filter?: ListSubjectsFilter) {
  return api.get<{ subjects: Subject[] }>(API_ROUTES.subjects.list, {
    queries: filter as Record<string, string | undefined>,
  });
}

export async function createSubject(body: CreateSubjectBody) {
  return api.post<{ subject: Subject }>(API_ROUTES.subjects.create, body);
}

export async function getSubject(id: string) {
  return api.get<{ subject: Subject }>(API_ROUTES.subjects.getById(id));
}

export async function getSubjectDetail(id: string) {
  return api.get<SubjectDetail>(API_ROUTES.subjects.detail(id));
}

export async function updateSubject(id: string, body: UpdateSubjectBody) {
  return api.patch<{ subject: Subject }>(API_ROUTES.subjects.updateById(id), body);
}

export async function deleteSubject(id: string) {
  return api.delete<null>(API_ROUTES.subjects.deleteById(id));
}

export async function getSubjectStaff(subjectId: string) {
  return api.get<{ staff: SubjectStaffMember[] }>(API_ROUTES.subjects.staff(subjectId));
}

export async function assignSubjectStaff(subjectId: string, userId: string) {
  return api.post<SubjectStaffMember>(API_ROUTES.subjects.staff(subjectId), { userId });
}

export async function removeSubjectStaff(subjectId: string, userId: string) {
  return api.delete<null>(API_ROUTES.subjects.staffMember(subjectId, userId));
}

export async function getSubjectEnrollments(subjectId: string) {
  return api.get<{ enrollments: SubjectEnrollment[] }>(API_ROUTES.subjects.enrollments(subjectId));
}

export async function bulkEnrollSubject(subjectId: string) {
  return api.post<{ count: number }>(API_ROUTES.subjects.enrollmentsBulk(subjectId), {});
}

export async function enrollStudent(subjectId: string, userId: string) {
  return api.post<SubjectEnrollment>(API_ROUTES.subjects.enrollStudent(subjectId, userId), {});
}

export async function unenrollStudent(subjectId: string, userId: string) {
  return api.delete<null>(API_ROUTES.subjects.unenrollStudent(subjectId, userId));
}

export async function getMySubjects() {
  return api.get<
    { subjects: StudentSubjectEntry[] } |
    { subjects: StaffSubjectEntry[]; majorAssignments: StaffMajorEntry[] }
  >(API_ROUTES.users.mySubjects);
}
