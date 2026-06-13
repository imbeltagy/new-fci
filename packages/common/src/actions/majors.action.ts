"use client";

import { API_ROUTES } from "../constants/api";
import { api } from "../lib/api-client";
import type { CreateMajorBody, Major, MajorStaffMember, UpdateMajorBody } from "../types/major";

export async function listMajors() {
  return api.get<{ majors: Major[] }>(API_ROUTES.majors.list);
}

export async function createMajor(body: CreateMajorBody) {
  return api.post<{ major: Major }>(API_ROUTES.majors.create, body);
}

export async function getMajor(id: string) {
  return api.get<{ major: Major }>(API_ROUTES.majors.getById(id));
}

export async function updateMajor(id: string, body: UpdateMajorBody) {
  return api.patch<{ major: Major }>(API_ROUTES.majors.updateById(id), body);
}

export async function deleteMajor(id: string) {
  return api.delete<null>(API_ROUTES.majors.deleteById(id));
}

export async function getMajorStaff(majorId: string, joinYearId?: string) {
  return api.get<{ staff: MajorStaffMember[] }>(API_ROUTES.majors.staff(majorId), {
    queries: joinYearId ? { joinYearId } : undefined,
  });
}

export async function assignMajorStaff(majorId: string, body: { userId: string; joinYearId: string }) {
  return api.post<MajorStaffMember>(API_ROUTES.majors.staff(majorId), body);
}

export async function removeMajorStaff(majorId: string, userId: string, joinYearId: string) {
  return api.delete<null>(API_ROUTES.majors.staffMember(majorId, userId, joinYearId));
}
