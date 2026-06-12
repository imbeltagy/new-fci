import { Router } from "express";

import { Role } from "@prisma/client";

import { auth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import * as accessGroupsController from "./access-groups.controller";
import { CreateAccessGroupDto } from "./dto/request/create-access-group.dto";
import { UpdateAccessGroupDto } from "./dto/request/update-access-group.dto";

const superadminOnly = auth({ authorization: "session", roles: [Role.superadmin] });

export const accessGroupsRouter = Router();

accessGroupsRouter.get("/", superadminOnly, accessGroupsController.listGroups);
accessGroupsRouter.post(
  "/",
  superadminOnly,
  /* #swagger.parameters['body'] = { in:'body', required:true, schema:{ $ref:'#/definitions/CreateAccessGroupDto' } } */
  validateBody(CreateAccessGroupDto),
  accessGroupsController.createGroup,
);
accessGroupsRouter.get("/:id", superadminOnly, accessGroupsController.getGroup);
accessGroupsRouter.patch(
  "/:id",
  superadminOnly,
  /* #swagger.parameters['body'] = { in:'body', schema:{ $ref:'#/definitions/UpdateAccessGroupDto' } } */
  validateBody(UpdateAccessGroupDto),
  accessGroupsController.updateGroup,
);
accessGroupsRouter.delete("/:id", superadminOnly, accessGroupsController.deleteGroup);
