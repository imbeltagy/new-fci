"use client";

import { API_ROUTES } from "../constants/api";
import { api } from "../lib/api-client";
import type {
  CreateTicketBody,
  ListTicketsFilter,
  Ticket,
  TicketDetail,
  TicketMessage,
  UpdateTicketStatusBody,
} from "../types/ticket";

export async function listTickets(filter?: ListTicketsFilter) {
  return api.get<{ tickets: Ticket[] }>(API_ROUTES.tickets.list, {
    queries: filter as Record<string, string | undefined>,
  });
}

export async function createTicket(body: CreateTicketBody) {
  return api.post<{ ticket: Ticket }>(API_ROUTES.tickets.create, body);
}

export async function getTicket(id: string) {
  return api.get<TicketDetail>(API_ROUTES.tickets.getById(id));
}

export async function updateTicketStatus(id: string, body: UpdateTicketStatusBody) {
  return api.patch<{ ticket: Ticket }>(API_ROUTES.tickets.status(id), body);
}

export async function sendTicketMessage(id: string, content: string) {
  return api.post<{ message: TicketMessage }>(API_ROUTES.tickets.messages(id), { content });
}
