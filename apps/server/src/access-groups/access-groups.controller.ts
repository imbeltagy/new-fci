import type { Request, Response } from "express";

import { AccessGroupsService } from "./access-groups.service";
import type { CreateAccessGroupDto } from "./dto/request/create-access-group.dto";
import type { UpdateAccessGroupDto } from "./dto/request/update-access-group.dto";

const service = new AccessGroupsService();

export async function listGroups(_req: Request, res: Response) {
  try {
    res.json({ groups: await service.listGroups() });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function createGroup(req: Request, res: Response) {
  try {
    res.status(201).json({ group: await service.createGroup(req.body as CreateAccessGroupDto) });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function getGroup(req: Request, res: Response) {
  try {
    res.json({ group: await service.getGroup(req.params["id"] as string) });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function updateGroup(req: Request, res: Response) {
  try {
    res.json({
      group: await service.updateGroup(
        req.params["id"] as string,
        req.body as UpdateAccessGroupDto,
      ),
    });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function deleteGroup(req: Request, res: Response) {
  try {
    await service.deleteGroup(req.params["id"] as string);
    res.sendStatus(204);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}
