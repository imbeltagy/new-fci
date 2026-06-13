import type { Request, Response } from "express";

import { Role } from "@prisma/client";

import type { CreateRoomDto } from "./dto/request/create-room.dto";
import type { MuteUserDto } from "./dto/request/mute-user.dto";
import { RoomsService } from "./rooms.service";

const svc = new RoomsService();

const isAdminRole = (role: Role) => role === Role.it || role === Role.superadmin;

export async function listRooms(req: Request, res: Response) {
  try {
    const { sub, role } = req.user!;
    if (isAdminRole(role)) {
      res.json({ rooms: await svc.listAllRooms() });
      return;
    }
    res.json({ rooms: await svc.listMyRooms(sub, role) });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function createRoom(req: Request, res: Response) {
  try {
    res.status(201).json({ room: await svc.createRoom(req.body as CreateRoomDto) });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function getRoom(req: Request, res: Response) {
  try {
    const { sub, role } = req.user!;
    const room = await svc.getRoom(req.params["id"] as string, sub, role, isAdminRole(role));
    res.json({ room });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function deleteRoom(req: Request, res: Response) {
  try {
    await svc.deleteRoom(req.params["id"] as string);
    res.status(204).send();
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function getMessages(req: Request, res: Response) {
  try {
    const { sub, role } = req.user!;
    const { before, limit } = req.query as Record<string, string | undefined>;
    const result = await svc.getMessages(
      req.params["id"] as string,
      sub,
      role,
      isAdminRole(role),
      before,
      Math.min(Number(limit) || 30, 100),
    );
    res.json(result);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function getPins(req: Request, res: Response) {
  try {
    const { sub, role } = req.user!;
    const pins = await svc.getPins(req.params["id"] as string, sub, role, isAdminRole(role));
    res.json({ pins });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function pinMessage(req: Request, res: Response) {
  try {
    const { sub, role } = req.user!;
    await svc.pinMessage(
      req.params["id"] as string,
      req.params["messageId"] as string,
      sub,
      role,
    );
    res.status(204).send();
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function unpinMessage(req: Request, res: Response) {
  try {
    const { sub, role } = req.user!;
    await svc.unpinMessage(
      req.params["id"] as string,
      req.params["messageId"] as string,
      sub,
      role,
    );
    res.status(204).send();
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function deleteMessage(req: Request, res: Response) {
  try {
    await svc.deleteMessage(req.params["id"] as string, req.params["messageId"] as string);
    res.status(204).send();
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function listMutes(req: Request, res: Response) {
  try {
    res.json({ mutes: await svc.listMutes(req.params["id"] as string) });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function muteUser(req: Request, res: Response) {
  try {
    const { mutedUntil } = req.body as MuteUserDto;
    const mute = await svc.muteUser(
      req.params["id"] as string,
      req.params["userId"] as string,
      mutedUntil ? new Date(mutedUntil) : null,
    );
    res.status(201).json({ mute });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function unmuteUser(req: Request, res: Response) {
  try {
    await svc.unmuteUser(req.params["id"] as string, req.params["userId"] as string);
    res.status(204).send();
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}
