"use client";

import { useQuery } from "@tanstack/react-query";

import { getTicket, listTickets } from "../actions/tickets.action";
import type { ListTicketsFilter } from "../types/ticket";

export const TICKET_KEYS = {
  all: ["tickets"] as const,
  list: (filter?: ListTicketsFilter) => ["tickets", "list", filter] as const,
  detail: (id: string) => ["tickets", "detail", id] as const,
};

export function useListTicketsQuery(filter?: ListTicketsFilter) {
  return useQuery({
    queryKey: TICKET_KEYS.list(filter),
    queryFn: () => listTickets(filter),
  });
}

export function useTicketQuery(id: string) {
  return useQuery({
    queryKey: TICKET_KEYS.detail(id),
    queryFn: () => getTicket(id),
    enabled: !!id,
  });
}
