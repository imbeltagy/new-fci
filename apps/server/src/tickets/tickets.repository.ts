import { Prisma, TicketStatus } from "@prisma/client";

import { getPrismaClient } from "../db/postgres";

const clientSelect = {
  select: {
    id: true,
    name: true,
    email: true,
    avatar: { select: { id: true, url: true } },
  },
} as const;

const ticketMessageInclude = {
  sender: {
    select: { id: true, name: true, avatar: { select: { id: true, url: true } } },
  },
} satisfies Prisma.TicketMessageInclude;

export class TicketsRepository {
  private get db() {
    return getPrismaClient();
  }

  async create(clientId: string, title: string, body: string) {
    return this.db.ticket.create({
      data: { clientId, title, body },
      include: { client: clientSelect },
    });
  }

  async findById(id: string) {
    return this.db.ticket.findUnique({
      where: { id },
      include: { client: clientSelect },
    });
  }

  async listForClient(clientId: string) {
    return this.db.ticket.findMany({
      where: { clientId },
      include: { client: clientSelect },
      orderBy: { updatedAt: "desc" },
    });
  }

  async listAll(filter: { status?: TicketStatus; search?: string }) {
    return this.db.ticket.findMany({
      where: {
        ...(filter.status && { status: filter.status }),
        ...(filter.search && {
          OR: [
            { title: { contains: filter.search, mode: "insensitive" } },
            { client: { name: { contains: filter.search, mode: "insensitive" } } },
          ],
        }),
      },
      include: { client: clientSelect },
      orderBy: { updatedAt: "desc" },
    });
  }

  async updateStatus(id: string, status: TicketStatus, rejectionReason: string | null) {
    return this.db.ticket.update({
      where: { id },
      data: { status, rejectionReason },
      include: { client: clientSelect },
    });
  }

  async findMessages(ticketId: string) {
    return this.db.ticketMessage.findMany({
      where: { ticketId },
      include: ticketMessageInclude,
      orderBy: { createdAt: "asc" },
    });
  }

  async createMessage(ticketId: string, senderId: string, content: string, isItSide: boolean) {
    const [message] = await this.db.$transaction([
      this.db.ticketMessage.create({
        data: { ticketId, senderId, content, isItSide },
        include: ticketMessageInclude,
      }),
      this.db.ticket.update({ where: { id: ticketId }, data: { updatedAt: new Date() } }),
    ]);
    return message;
  }
}
