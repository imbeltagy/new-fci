import { Router } from "express";
import multer from "multer";

import { Role } from "@prisma/client";

import { Permission } from "../config/permissions.config";
import { auth, authEither } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import * as ctrl from "./rooms.controller";
import { CreateRoomDto } from "./dto/request/create-room.dto";
import { MuteUserDto } from "./dto/request/mute-user.dto";

const upload = multer({ storage: multer.memoryStorage() });

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

// Rooms
roomsRouter.get("/", memberOrAdmin, ctrl.listRooms);
roomsRouter.post("/", adminOnly, validateBody(CreateRoomDto), ctrl.createRoom);
roomsRouter.get("/:id", memberOrAdmin, ctrl.getRoom);
roomsRouter.delete("/:id", adminOnly, ctrl.deleteRoom);

// Feed (posts)
roomsRouter.get("/:id/posts", memberOrAdmin, ctrl.listPosts);
roomsRouter.post("/:id/posts", clientOnly, upload.single("image"), ctrl.createPost);
roomsRouter.get("/:id/posts/:postId", memberOrAdmin, ctrl.getPost);
roomsRouter.delete("/:id/posts/:postId", memberOrAdmin, ctrl.deletePost);

// Likes
roomsRouter.post("/:id/posts/:postId/like", clientOnly, ctrl.likePost);
roomsRouter.delete("/:id/posts/:postId/like", clientOnly, ctrl.unlikePost);

// Comments
roomsRouter.get("/:id/posts/:postId/comments", memberOrAdmin, ctrl.listComments);
roomsRouter.post("/:id/posts/:postId/comments", clientOnly, ctrl.createComment);
roomsRouter.delete("/:id/posts/:postId/comments/:commentId", memberOrAdmin, ctrl.deleteComment);

// Pins (faculty)
roomsRouter.get("/:id/pins", memberOrAdmin, ctrl.getPins);
roomsRouter.post("/:id/pins/:postId", clientOnly, ctrl.pinPost);
roomsRouter.delete("/:id/pins/:postId", clientOnly, ctrl.unpinPost);

// Mutes (admin moderation)
roomsRouter.get("/:id/mutes", adminOnly, ctrl.listMutes);
roomsRouter.post("/:id/mute/:userId", adminOnly, validateBody(MuteUserDto), ctrl.muteUser);
roomsRouter.delete("/:id/mute/:userId", adminOnly, ctrl.unmuteUser);
