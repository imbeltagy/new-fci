"use client";

import { API_ROUTES } from "../constants/api";
import { api } from "../lib/api-client";
import type {
  AccessGroup,
  CreateAccessGroupBody,
  UpdateAccessGroupBody,
} from "../types/access-group";

export async function listGroups() {
  return api.get<{ groups: AccessGroup[] }>(API_ROUTES.accessGroups.list);
}

export async function createGroup(body: CreateAccessGroupBody) {
  return api.post<{ group: AccessGroup }>(API_ROUTES.accessGroups.create, body);
}

export async function getGroup(id: string) {
  return api.get<{ group: AccessGroup }>(API_ROUTES.accessGroups.getById(id));
}

export async function updateGroup(id: string, body: UpdateAccessGroupBody) {
  return api.patch<{ group: AccessGroup }>(
    API_ROUTES.accessGroups.updateById(id),
    body
  );
}

export async function deleteGroup(id: string) {
  return api.delete(API_ROUTES.accessGroups.deleteById(id));
}
