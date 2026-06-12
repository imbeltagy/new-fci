import { createHash } from "crypto";

import type { User } from "@prisma/client";

import { getPrismaClient } from "../db/postgres";

type UserWithGroup = User & {
  accessGroup: { permissions: { key: string }[] } | null;
};

export class AuthRepository {
  private get db() {
    return getPrismaClient();
  }

  async findActiveUserByEmail(email: string): Promise<UserWithGroup | null> {
    return this.db.user.findUnique({
      where: { email, isActive: true },
      include: { accessGroup: { include: { permissions: true } } },
    });
  }

  async findActiveUserById(id: string): Promise<UserWithGroup | null> {
    return this.db.user.findUnique({
      where: { id, isActive: true },
      include: { accessGroup: { include: { permissions: true } } },
    });
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.db.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false },
    });
  }

  async createPasswordResetToken(
    userId: string,
    rawToken: string,
    expiresAt: Date,
  ): Promise<void> {
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    await this.db.passwordResetToken.deleteMany({ where: { userId } });
    await this.db.passwordResetToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  async findValidResetToken(rawToken: string) {
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    return this.db.passwordResetToken.findUnique({
      where: { tokenHash },
    });
  }

  async markResetTokenUsed(id: string): Promise<void> {
    await this.db.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }
}
