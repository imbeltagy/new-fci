import type { Request, Response } from "express";

import { UsersService } from "./users.service";
import type { CreateManyUsersDto } from "./dto/request/create-many-users.dto";
import type { CreateUserDto } from "./dto/request/create-user.dto";
import type { SendCredentialsDto } from "./dto/request/send-credentials.dto";
import type { UpdateMeDto } from "./dto/request/update-me.dto";
import type { UpdateUserDto } from "./dto/request/update-user.dto";

const usersService = new UsersService();

export async function listUsers(req: Request, res: Response) {
  try {
    const { role, isActive, search } = req.query as Record<string, string | undefined>;
    const users = await usersService.listUsers({
      role: role as any,
      isActive: isActive !== undefined ? isActive === "true" : undefined,
      search,
    });
    res.json({ users });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function createUser(req: Request, res: Response) {
  try {
    res.status(201).json(await usersService.createUser(req.body as CreateUserDto));
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function createManyUsers(req: Request, res: Response) {
  try {
    const { users } = req.body as CreateManyUsersDto;
    res.status(201).json({ created: await usersService.createManyUsers(users) });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function getMe(req: Request, res: Response) {
  try {
    res.json({ user: await usersService.getUser(req.user!.sub) });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function updateMe(req: Request, res: Response) {
  try {
    res.json({
      user: await usersService.updateProfile(
        req.user!.sub,
        req.body as UpdateMeDto,
        req.user!.role,
      ),
    });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function sendCredentials(req: Request, res: Response) {
  try {
    const { userIds } = req.body as SendCredentialsDto;
    res.json(await usersService.sendCredentials(userIds));
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function getUser(req: Request, res: Response) {
  try {
    res.json({ user: await usersService.getUser(req.params["id"] as string) });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    res.json({
      user: await usersService.adminUpdateUser(
        req.params["id"] as string,
        req.body as UpdateUserDto,
      ),
    });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}
