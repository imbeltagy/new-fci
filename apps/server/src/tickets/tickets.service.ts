import { Role, TicketStatus } from "@prisma/client";

import { getIO } from "../lib/socket";
import { IT_STAFF_ROOM, userRoom } from "../socket/types";
import type { CreateTicketDto } from "./dto/request/create-ticket.dto";
import type { SendTicketMessageDto } from "./dto/request/send-ticket-message.dto";
import type { UpdateTicketStatusDto } from "./dto/request/update-ticket-status.dto";
import { TicketsRepository } from "./tickets.repository";

const err = (message: string, status: number) =>
  Object.assign(new Error(message), { status });

const isAdminRole = (role: Role) => role === Role.it || role === Role.superadmin;

/** Statuses in which a support conversation exists. */
const CONVERSATION_STATUSES = new Set<TicketStatus>([
  TicketStatus.open,
  TicketStatus.done,
]);

type RawTicket = NonNullable<Awaited<ReturnType<TicketsRepository["findById"]>>>;
type RawTicketMessage = Awaited<ReturnType<TicketsRepository["createMessage"]>>;

export class TicketsService {
  constructor(private readonly repo = new TicketsRepository()) {}

  private mapTicket(t: RawTicket) {
    return {
      id: t.id,
      title: t.title,
      body: t.body,
      status: t.status,
      rejectionReason: t.rejectionReason,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      client: {
        id: t.client.id,
        name: t.client.name,
        email: t.client.email,
        avatarUrl: t.client.avatar?.url ?? null,
      },
    };
  }

  /** IT identities are hidden from the client — they see a single "IT Support". */
  private mapMessage(m: RawTicketMessage, viewerIsClient: boolean) {
    if (viewerIsClient && m.isItSide) {
      return {
        id: m.id,
        ticketId: m.ticketId,
        content: m.content,
        isItSide: true,
        createdAt: m.createdAt,
        sender: { id: "it-support", name: "IT Support", avatarUrl: null },
      };
    }
    return {
      id: m.id,
      ticketId: m.ticketId,
      content: m.content,
      isItSide: m.isItSide,
      createdAt: m.createdAt,
      sender: {
        id: m.sender.id,
        name: m.sender.name,
        avatarUrl: m.sender.avatar?.url ?? null,
      },
    };
  }

  async createTicket(clientId: string, dto: CreateTicketDto) {
    const ticket = await this.repo.create(clientId, dto.title, dto.body);
    // Let the IT side know a new ticket landed.
    try {
      getIO().to(IT_STAFF_ROOM).emit("ticket:new", this.mapTicket(ticket));
    } catch {
      /* socket optional */
    }
    return this.mapTicket(ticket);
  }

  async listTickets(
    userId: string,
    role: Role,
    filter: { status?: TicketStatus; search?: string },
  ) {
    const tickets = isAdminRole(role)
      ? await this.repo.listAll(filter)
      : await this.repo.listForClient(userId);
    return tickets.map((t) => this.mapTicket(t));
  }

  async getTicket(id: string, userId: string, role: Role) {
    const ticket = await this.repo.findById(id);
    if (!ticket) throw err("Ticket not found", 404);

    const isAdmin = isAdminRole(role);
    if (!isAdmin && ticket.clientId !== userId) throw err("Forbidden", 403);

    const messages = CONVERSATION_STATUSES.has(ticket.status)
      ? (await this.repo.findMessages(id)).map((m) => this.mapMessage(m, !isAdmin))
      : [];

    return { ticket: this.mapTicket(ticket), messages };
  }

  async changeStatus(id: string, dto: UpdateTicketStatusDto) {
    if (dto.status === TicketStatus.pending) {
      throw err("A ticket cannot be set back to pending", 400);
    }
    const ticket = await this.repo.findById(id);
    if (!ticket) throw err("Ticket not found", 404);

    if (dto.status === TicketStatus.rejected && !dto.rejectionReason?.trim()) {
      throw err("A rejection reason is required", 400);
    }

    const reason = dto.status === TicketStatus.rejected ? dto.rejectionReason!.trim() : null;
    const updated = await this.repo.updateStatus(id, dto.status, reason);

    const payload = {
      ticketId: id,
      status: updated.status,
      rejectionReason: updated.rejectionReason,
    };
    try {
      const io = getIO();
      io.to(userRoom(updated.clientId)).emit("ticket:status", payload);
      io.to(IT_STAFF_ROOM).emit("ticket:status", payload);
    } catch {
      /* socket optional */
    }

    return this.mapTicket(updated);
  }

  async postMessage(
    id: string,
    senderId: string,
    role: Role,
    dto: SendTicketMessageDto,
  ) {
    const content = dto.content.trim();
    if (!content) throw err("Message cannot be empty", 400);

    const ticket = await this.repo.findById(id);
    if (!ticket) throw err("Ticket not found", 404);

    const isAdmin = isAdminRole(role);
    if (!isAdmin && ticket.clientId !== senderId) throw err("Forbidden", 403);

    if (isAdmin) {
      if (ticket.status !== TicketStatus.open && ticket.status !== TicketStatus.done) {
        throw err("The conversation is not open", 400);
      }
    } else if (ticket.status !== TicketStatus.open) {
      throw err("You can only message while the ticket is open", 400);
    }

    const raw = await this.repo.createMessage(id, senderId, content, isAdmin);

    try {
      const io = getIO();
      io.to(userRoom(ticket.clientId)).emit("ticket:message", this.mapMessage(raw, true));
      io.to(IT_STAFF_ROOM).emit("ticket:message", this.mapMessage(raw, false));
    } catch {
      /* socket optional */
    }

    // Return the sender's own view.
    return this.mapMessage(raw, !isAdmin);
  }
}
