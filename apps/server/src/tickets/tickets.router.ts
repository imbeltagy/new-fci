import { Router } from "express";

import { Role } from "@prisma/client";

import { Permission } from "../config/permissions.config";
import { auth, authEither } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import * as ctrl from "./tickets.controller";
import { CreateTicketDto } from "./dto/request/create-ticket.dto";
import { SendTicketMessageDto } from "./dto/request/send-ticket-message.dto";
import { UpdateTicketStatusDto } from "./dto/request/update-ticket-status.dto";

const anyClient: Role[] = [Role.student, Role.teacher, Role.sub_teacher];
const anyAdmin: Role[] = [Role.it, Role.superadmin];

const clientOnly = auth({ authorization: "jwt", roles: anyClient });
const clientOrIt = authEither({
  clientRoles: anyClient,
  adminRoles: anyAdmin,
  permissions: [Permission.TICKETS_MANAGE],
});
const itOnly = auth({
  authorization: "session",
  roles: anyAdmin,
  permissions: [Permission.TICKETS_MANAGE],
});

export const ticketsRouter = Router();

// Clients create; both sides list (role-aware) and read.
ticketsRouter.post("/", clientOnly, validateBody(CreateTicketDto), ctrl.createTicket);
ticketsRouter.get("/", clientOrIt, ctrl.listTickets);
ticketsRouter.get("/:id", clientOrIt, ctrl.getTicket);

// IT triages status; both sides message (gated by status in the service).
ticketsRouter.patch("/:id/status", itOnly, validateBody(UpdateTicketStatusDto), ctrl.updateStatus);
ticketsRouter.post("/:id/messages", clientOrIt, validateBody(SendTicketMessageDto), ctrl.sendMessage);
