import { Router } from "express";

import { Role } from "@prisma/client";

import { Permission } from "../config/permissions.config";
import { auth, authEither } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import * as ctrl from "./rooms.controller";
import { CreateRoomDto } from "./dto/request/create-room.dto";
import { MuteUserDto } from "./dto/request/mute-user.dto";

const anyClient: Role[] = [Role.student, Role.teacher, Role.sub_teacher];
const anyAdmin: Role[] = [Role.it, Role.superadmin];

const memberOrAdmin = authEither({
  clientRoles: anyClient,
  adminRoles: anyAdmin,
  permissions: [Permission.CHANNELS_MODERATE],
});
const adminOnly = auth({
  authorization: "session",
  roles: anyAdmin,
  permissions: [Permission.CHANNELS_MODERATE],
});
const clientOnly = auth({ authorization: "jwt", roles: anyClient });

export const roomsRouter = Router();

// List + create
roomsRouter.get("/", memberOrAdmin, ctrl.listRooms);
roomsRouter.post("/", adminOnly, validateBody(CreateRoomDto), ctrl.createRoom);

// Single room
roomsRouter.get("/:id", memberOrAdmin, ctrl.getRoom);
roomsRouter.delete("/:id", adminOnly, ctrl.deleteRoom);

// Messages
roomsRouter.get("/:id/messages", memberOrAdmin, ctrl.getMessages);
roomsRouter.delete("/:id/messages/:messageId", adminOnly, ctrl.deleteMessage);

// Pins (faculty members pin/unpin; anyone in the room can read)
roomsRouter.get("/:id/pins", memberOrAdmin, ctrl.getPins);
roomsRouter.post("/:id/pins/:messageId", clientOnly, ctrl.pinMessage);
roomsRouter.delete("/:id/pins/:messageId", clientOnly, ctrl.unpinMessage);

// Mutes (admin moderation)
roomsRouter.get("/:id/mutes", adminOnly, ctrl.listMutes);
roomsRouter.post("/:id/mute/:userId", adminOnly, validateBody(MuteUserDto), ctrl.muteUser);
roomsRouter.delete("/:id/mute/:userId", adminOnly, ctrl.unmuteUser);
