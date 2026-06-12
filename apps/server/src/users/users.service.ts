import { randomBytes } from "crypto";

import type { Role } from "@prisma/client";

import { hashPassword } from "../lib/bcrypt";
import { sendCredentialsEmail } from "../lib/email";
import { deleteUserSessions } from "../lib/session";
import type { CreateUserDto } from "./dto/request/create-user.dto";
import type { UpdateMeDto } from "./dto/request/update-me.dto";
import type { UpdateUserDto } from "./dto/request/update-user.dto";
import { UsersRepository } from "./users.repository";

const generateTempPassword = () => randomBytes(9).toString("base64url");

export class UsersService {
  constructor(private readonly repo = new UsersRepository()) {}

  async listUsers(filter: { role?: Role; isActive?: boolean; search?: string }) {
    return this.repo.findAll(filter);
  }

  async getUser(id: string) {
    const user = await this.repo.findById(id);
    if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
    return user;
  }

  async createUser(dto: CreateUserDto) {
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    const user = await this.repo.create({ ...dto, passwordHash });
    return { user, temporaryPassword: tempPassword };
  }

  async createManyUsers(users: CreateUserDto[]) {
    const prepared = await Promise.all(
      users.map(async (dto) => {
        const tempPassword = generateTempPassword();
        const passwordHash = await hashPassword(tempPassword);
        return { dto, tempPassword, passwordHash };
      }),
    );

    await this.repo.createMany(
      prepared.map(({ dto, passwordHash }) => ({ ...dto, passwordHash })),
    );

    return prepared.map(({ dto, tempPassword }) => ({
      email: dto.email,
      temporaryPassword: tempPassword,
    }));
  }

  async updateProfile(id: string, dto: UpdateMeDto, requestingRole: Role) {
    const safeData =
      requestingRole !== "student" ? { ...dto, whatsapp: undefined } : dto;
    return this.repo.updateProfile(id, safeData);
  }

  async adminUpdateUser(id: string, dto: UpdateUserDto) {
    const existingUser = await this.repo.findById(id);
    if (!existingUser) {
      throw Object.assign(new Error("User not found"), { status: 404 });
    }

    if ("accessGroupId" in dto && dto.accessGroupId !== existingUser.accessGroupId) {
      await deleteUserSessions([id]);
    }

    return this.repo.adminUpdate(id, dto);
  }

  async sendCredentials(userIds: string[]) {
    const users = await this.repo.findManyByIds(userIds);
    const sent: string[] = [];
    const skipped: string[] = [];

    await Promise.all(
      users.map(async (user) => {
        const tempPassword = generateTempPassword();
        const passwordHash = await hashPassword(tempPassword);
        await this.repo.updatePasswordAndSendOnce(user.id, passwordHash);
        await sendCredentialsEmail(user.email, tempPassword);
        sent.push(user.id);
      }),
    );

    const foundIds = new Set(users.map((u) => u.id));
    userIds.filter((id) => !foundIds.has(id)).forEach((id) => skipped.push(id));

    return { sent, skipped };
  }
}
