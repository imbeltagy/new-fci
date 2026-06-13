"use client";

import { API_ROUTES } from "../constants/api";
import { api } from "../lib/api-client";
import type {
  ConversationListItem,
  ConversationSummary,
  DirectMessagesPage,
} from "../types/conversation";

export async function listConversations() {
  return api.get<{ conversations: ConversationListItem[] }>(API_ROUTES.conversations.list);
}

export async function startConversation(userId: string) {
  return api.post<{ conversation: ConversationSummary }>(API_ROUTES.conversations.start, {
    userId,
  });
}

export async function getConversation(id: string) {
  return api.get<{ conversation: ConversationSummary }>(API_ROUTES.conversations.getById(id));
}

export async function getConversationMessages(
  id: string,
  params?: { page?: number; limit?: number },
) {
  return api.get<DirectMessagesPage>(API_ROUTES.conversations.messages(id), {
    queries: {
      ...(params?.page !== undefined && { page: String(params.page) }),
      ...(params?.limit && { limit: String(params.limit) }),
    },
  });
}
