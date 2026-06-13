import { randomBytes } from "crypto";

import { Role } from "@prisma/client";

import { FilesService } from "../files/files.service";
import { hashPassword } from "../lib/bcrypt";
import { sendCredentialsEmail } from "../lib/email";
import { deleteUserSessions } from "../lib/session";
import type { CreateUserDto } from "./dto/request/create-user.dto";
import type { UpdateMeDto } from "./dto/request/update-me.dto";
import type { UpdateUserDto } from "./dto/request/update-user.dto";
import { UsersRepository } from "./users.repository";

const generateTempPassword = () => randomBytes(9).toString("base64url");

export class UsersService {
  constructor(
    private readonly repo = new UsersRepository(),
    private readonly filesService = new FilesService(),
  ) {}

  async listUsers(filter: {
    role?: Role;
    isActive?: boolean;
    search?: string;
    accessGroupId?: string;
    requesterRole?: Role;
  }) {
    const excludeRoles: Role[] =
      filter.requesterRole === Role.it && !filter.role
        ? [Role.it, Role.superadmin]
        : [];
    return this.repo.findAll({ ...filter, excludeRoles });
  }

  async getUser(id: string) {
    const user = await this.repo.findById(id);
    if (!user)
      throw Object.assign(new Error("User not found"), { status: 404 });
    return user;
  }

  async createUser(dto: CreateUserDto) {
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    const user = await this.repo.create({ ...dto, passwordHash, tempPassword });
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
      prepared.map(({ dto, passwordHash, tempPassword }) => ({
        ...dto,
        passwordHash,
        tempPassword,
      })),
    );

    return prepared.map(({ dto, tempPassword }) => ({
      email: dto.email,
      temporaryPassword: tempPassword,
    }));
  }

  async updateProfile(
    userId: string,
    dto: UpdateMeDto,
    requestingRole: Role,
    files: { avatar?: Express.Multer.File; cover?: Express.Multer.File },
  ) {
    const current = await this.repo.findAvatarCoverIds(userId);
    const update: { name?: string; avatarId?: string; coverId?: string; whatsapp?: string } = {
      name: dto.name,
      whatsapp: requestingRole === Role.student ? dto.whatsapp : undefined,
    };

    if (files.avatar) {
      const f = files.avatar;
      const uploaded = await this.filesService.upload(f.buffer, f.originalname, f.mimetype, f.size);
      update.avatarId = uploaded.id;
      if (current?.avatarId) await this.filesService.softDelete(current.avatarId);
    }

    if (files.cover) {
      const f = files.cover;
      const uploaded = await this.filesService.upload(f.buffer, f.originalname, f.mimetype, f.size);
      update.coverId = uploaded.id;
      if (current?.coverId) await this.filesService.softDelete(current.coverId);
    }

    return this.repo.updateProfile(userId, update);
  }

  async adminUpdateUser(id: string, dto: UpdateUserDto) {
    const existingUser = await this.repo.findById(id);
    if (!existingUser) {
      throw Object.assign(new Error("User not found"), { status: 404 });
    }

    if ("accessGroupId" in dto && dto.accessGroupId != null) {
      if (existingUser.role !== Role.it) {
        throw Object.assign(
          new Error("Only IT users can be assigned to access groups"),
          { status: 400 },
        );
      }
    }

    if (
      "accessGroupId" in dto &&
      dto.accessGroupId !== existingUser.accessGroupId
    ) {
      await deleteUserSessions([id]);
    }

    return this.repo.adminUpdate(id, dto);
  }

  async deleteUser(id: string, requesterRole: Role) {
    const user = await this.repo.findById(id);
    if (!user)
      throw Object.assign(new Error("User not found"), { status: 404 });

    if (
      requesterRole === Role.it &&
      (user.role === Role.it || user.role === Role.superadmin)
    ) {
      throw Object.assign(new Error("Forbidden"), { status: 403 });
    }

    if (user.avatar) await this.filesService.softDelete(user.avatar.id);
    if (user.cover) await this.filesService.softDelete(user.cover.id);

    await deleteUserSessions([id]);
    await this.repo.hardDelete(id);
  }

  async getMySubjects(userId: string, role: string) {
    if (role === "student") {
      return { subjects: await this.repo.findStudentSubjects(userId) };
    }
    return this.repo.findStaffSubjects(userId);
  }

  async sendCredentials(userIds: string[]) {
    const users = await this.repo.findManyByIds(userIds);
    const sent: string[] = [];
    const skipped: string[] = [];

    for (const user of users) {
      if (!user.mustChangePassword) {
        throw Object.assign(
          new Error("User has already changed their password"),
          { status: 400 },
        );
      }

      if (!user.tempPassword) {
        skipped.push(user.id);
        continue;
      }

      await sendCredentialsEmail(user.email, user.tempPassword);
      sent.push(user.id);
    }

    const foundIds = new Set(users.map((u) => u.id));
    userIds.filter((id) => !foundIds.has(id)).forEach((id) => skipped.push(id));

    return { sent, skipped };
  }
}
