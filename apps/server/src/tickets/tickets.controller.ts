import type { Request, Response } from "express";

import { TicketStatus } from "@prisma/client";

import type { CreateTicketDto } from "./dto/request/create-ticket.dto";
import type { SendTicketMessageDto } from "./dto/request/send-ticket-message.dto";
import type { UpdateTicketStatusDto } from "./dto/request/update-ticket-status.dto";
import { TicketsService } from "./tickets.service";

const svc = new TicketsService();

export async function createTicket(req: Request, res: Response) {
  try {
    const ticket = await svc.createTicket(req.user!.sub, req.body as CreateTicketDto);
    res.status(201).json({ ticket });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function listTickets(req: Request, res: Response) {
  try {
    const { status, search } = req.query as Record<string, string | undefined>;
    const tickets = await svc.listTickets(req.user!.sub, req.user!.role, {
      status: status as TicketStatus | undefined,
      search,
    });
    res.json({ tickets });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function getTicket(req: Request, res: Response) {
  try {
    const result = await svc.getTicket(req.params["id"] as string, req.user!.sub, req.user!.role);
    res.json(result);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function updateStatus(req: Request, res: Response) {
  try {
    const ticket = await svc.changeStatus(
      req.params["id"] as string,
      req.body as UpdateTicketStatusDto,
    );
    res.json({ ticket });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function sendMessage(req: Request, res: Response) {
  try {
    const message = await svc.postMessage(
      req.params["id"] as string,
      req.user!.sub,
      req.user!.role,
      req.body as SendTicketMessageDto,
    );
    res.status(201).json({ message });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}
