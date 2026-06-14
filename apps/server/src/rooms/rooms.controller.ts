import type { Request, Response } from "express";

import { Role } from "@prisma/client";

import type { CreateRoomDto } from "./dto/request/create-room.dto";
import type { MuteUserDto } from "./dto/request/mute-user.dto";
import { RoomsService } from "./rooms.service";

const svc = new RoomsService();

const isAdminRole = (role: Role) => role === Role.it || role === Role.superadmin;

// ── Rooms ─────────────────────────────────────────────────────────────────

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

// ── Posts ─────────────────────────────────────────────────────────────────

export async function listPosts(req: Request, res: Response) {
  try {
    const { sub, role } = req.user!;
    const { before, limit } = req.query as Record<string, string | undefined>;
    const result = await svc.listPosts(
      req.params["id"] as string,
      sub,
      role,
      isAdminRole(role),
      before,
      Math.min(Number(limit) || 20, 50),
    );
    res.json(result);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function getPost(req: Request, res: Response) {
  try {
    const { sub, role } = req.user!;
    const post = await svc.getPost(
      req.params["id"] as string,
      req.params["postId"] as string,
      sub,
      role,
      isAdminRole(role),
    );
    res.json({ post });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function createPost(req: Request, res: Response) {
  try {
    const { sub, role } = req.user!;
    const content = (req.body?.content as string | undefined) ?? "";
    const post = await svc.createPost(req.params["id"] as string, sub, role, content, req.file);
    res.status(201).json({ post });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function deletePost(req: Request, res: Response) {
  try {
    const { sub, role } = req.user!;
    await svc.deletePost(
      req.params["id"] as string,
      req.params["postId"] as string,
      sub,
      role,
      isAdminRole(role),
    );
    res.status(204).send();
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function likePost(req: Request, res: Response) {
  try {
    const { sub, role } = req.user!;
    const result = await svc.likePost(
      req.params["id"] as string,
      req.params["postId"] as string,
      sub,
      role,
    );
    res.json(result);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function unlikePost(req: Request, res: Response) {
  try {
    const { sub, role } = req.user!;
    const result = await svc.unlikePost(
      req.params["id"] as string,
      req.params["postId"] as string,
      sub,
      role,
    );
    res.json(result);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

// ── Comments ──────────────────────────────────────────────────────────────

export async function listComments(req: Request, res: Response) {
  try {
    const { sub, role } = req.user!;
    const comments = await svc.getComments(
      req.params["id"] as string,
      req.params["postId"] as string,
      sub,
      role,
      isAdminRole(role),
    );
    res.json({ comments });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function createComment(req: Request, res: Response) {
  try {
    const { sub, role } = req.user!;
    const { content, parentId } = req.body as { content: string; parentId?: string };
    const comment = await svc.createComment(
      req.params["id"] as string,
      req.params["postId"] as string,
      sub,
      role,
      content ?? "",
      parentId ?? null,
    );
    res.status(201).json({ comment });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function deleteComment(req: Request, res: Response) {
  try {
    const { sub, role } = req.user!;
    await svc.deleteComment(
      req.params["id"] as string,
      req.params["postId"] as string,
      req.params["commentId"] as string,
      sub,
      isAdminRole(role),
    );
    res.status(204).send();
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

// ── Pins ──────────────────────────────────────────────────────────────────

export async function getPins(req: Request, res: Response) {
  try {
    const { sub, role } = req.user!;
    const pins = await svc.getPins(req.params["id"] as string, sub, role, isAdminRole(role));
    res.json({ pins });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function pinPost(req: Request, res: Response) {
  try {
    const { sub, role } = req.user!;
    await svc.pinPost(req.params["id"] as string, req.params["postId"] as string, sub, role);
    res.status(204).send();
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function unpinPost(req: Request, res: Response) {
  try {
    const { sub, role } = req.user!;
    await svc.unpinPost(req.params["id"] as string, req.params["postId"] as string, sub, role);
    res.status(204).send();
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

// ── Moderation ────────────────────────────────────────────────────────────

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
