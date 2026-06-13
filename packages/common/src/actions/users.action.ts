"use client";

import { API_ROUTES } from "../constants/api";
import { api } from "../lib/api-client";
import type { CreateUserBody, ListUsersFilter, UpdateMeBody, UpdateUserBody, User } from "../types/user";

export async function listUsers(filter?: ListUsersFilter) {
  return api.get<{ users: User[] }>(API_ROUTES.users.list, {
    queries: filter as Record<string, string | undefined>,
  });
}

export async function createUser(body: CreateUserBody) {
  return api.post<{ user: User; temporaryPassword: string }>(
    API_ROUTES.users.create,
    body
  );
}

export async function createManyUsers(users: CreateUserBody[]) {
  return api.post<{ email: string; temporaryPassword: string }[]>(
    API_ROUTES.users.bulk,
    { users }
  );
}

export async function getMe() {
  return api.get<{ user: User }>(API_ROUTES.users.me);
}

export async function updateMe(body: UpdateMeBody) {
  return api.patch<{ user: User }>(API_ROUTES.users.updateMe, body);
}

export async function sendCredentials(userIds: string[]) {
  return api.post<{ sent: string[]; skipped: string[] }>(
    API_ROUTES.users.sendCredentials,
    { userIds }
  );
}

export async function getUser(id: string) {
  return api.get<{ user: User }>(API_ROUTES.users.getById(id));
}

export async function updateUser(id: string, body: UpdateUserBody) {
  return api.patch<{ user: User }>(API_ROUTES.users.updateById(id), body);
}
