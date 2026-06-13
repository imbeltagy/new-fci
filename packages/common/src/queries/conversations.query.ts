"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getConversation,
  getConversationMessages,
  listConversations,
} from "../actions/conversations.action";

export const CONVERSATION_KEYS = {
  all: ["conversations"] as const,
  list: () => ["conversations", "list"] as const,
  detail: (id: string) => ["conversations", "detail", id] as const,
  messages: (id: string) => ["conversations", "messages", id] as const,
};

export function useListConversationsQuery() {
  return useQuery({
    queryKey: CONVERSATION_KEYS.list(),
    queryFn: listConversations,
  });
}

export function useConversationQuery(id: string) {
  return useQuery({
    queryKey: CONVERSATION_KEYS.detail(id),
    queryFn: () => getConversation(id),
    enabled: !!id,
  });
}

/** Most recent page of history (page = -1). Older pages fetched imperatively on scroll. */
export function useConversationMessagesQuery(id: string) {
  return useQuery({
    queryKey: CONVERSATION_KEYS.messages(id),
    queryFn: () => getConversationMessages(id, { page: -1 }),
    enabled: !!id,
  });
}
