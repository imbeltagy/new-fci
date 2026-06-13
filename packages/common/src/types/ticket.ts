export type TicketStatus = "pending" | "in_review" | "open" | "rejected" | "done";

export interface Ticket {
  id: string;
  title: string;
  body: string;
  status: TicketStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  client: { id: string; name: string; email: string; avatarUrl: string | null };
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  content: string;
  isItSide: boolean;
  createdAt: string;
  sender: { id: string; name: string; avatarUrl: string | null };
}

export interface TicketDetail {
  ticket: Ticket;
  messages: TicketMessage[];
}

export interface CreateTicketBody {
  title: string;
  body: string;
}

export interface UpdateTicketStatusBody {
  status: Exclude<TicketStatus, "pending">;
  rejectionReason?: string;
}

export interface ListTicketsFilter {
  status?: TicketStatus;
  search?: string;
}

export interface TicketStatusEvent {
  ticketId: string;
  status: TicketStatus;
  rejectionReason: string | null;
}
