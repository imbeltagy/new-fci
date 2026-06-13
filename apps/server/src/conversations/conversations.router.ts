import { Router } from "express";

import { Role } from "@prisma/client";

import { auth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import * as ctrl from "./conversations.controller";
import { StartConversationDto } from "./dto/request/start-conversation.dto";

const anyClient: Role[] = [Role.student, Role.teacher, Role.sub_teacher];

const clientOnly = auth({ authorization: "jwt", roles: anyClient });

export const conversationsRouter = Router();

conversationsRouter.get("/", clientOnly, ctrl.listConversations);
conversationsRouter.post("/", clientOnly, validateBody(StartConversationDto), ctrl.startConversation);
conversationsRouter.get("/:id", clientOnly, ctrl.getConversation);
conversationsRouter.get("/:id/messages", clientOnly, ctrl.getMessages);
