"use client";

import { API_ROUTES } from "../constants/api";
import { api } from "../lib/api-client";
import type { CreateJoinYearBody, JoinYear, UpdateJoinYearBody } from "../types/join-year";

export async function listJoinYears() {
  return api.get<{ joinYears: JoinYear[] }>(API_ROUTES.joinYears.list);
}

export async function createJoinYear(body: CreateJoinYearBody) {
  return api.post<{ joinYear: JoinYear }>(API_ROUTES.joinYears.create, body);
}

export async function getJoinYear(id: string) {
  return api.get<{ joinYear: JoinYear }>(API_ROUTES.joinYears.getById(id));
}

export async function updateJoinYear(id: string, body: UpdateJoinYearBody) {
  return api.patch<{ joinYear: JoinYear }>(API_ROUTES.joinYears.updateById(id), body);
}

export async function deleteJoinYear(id: string) {
  return api.delete<null>(API_ROUTES.joinYears.deleteById(id));
}
