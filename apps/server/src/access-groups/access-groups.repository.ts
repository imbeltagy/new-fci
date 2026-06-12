import { getPrismaClient } from "../db/postgres";

export class AccessGroupsRepository {
  private get db() {
    return getPrismaClient();
  }

  async findAll() {
    return this.db.accessGroup.findMany({
      include: {
        permissions: { select: { id: true, key: true } },
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    return this.db.accessGroup.findUnique({
      where: { id },
      include: {
        permissions: { select: { id: true, key: true } },
        users: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async create(data: { name: string; description?: string; permissionKeys: string[] }) {
    return this.db.accessGroup.create({
      data: {
        name: data.name,
        description: data.description,
        permissions: {
          create: data.permissionKeys.map((key) => ({ key })),
        },
      },
      include: { permissions: { select: { id: true, key: true } } },
    });
  }

  async update(
    id: string,
    data: { name?: string; description?: string; permissionKeys?: string[] },
  ) {
    return this.db.accessGroup.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.permissionKeys && {
          permissions: {
            deleteMany: {},
            create: data.permissionKeys.map((key) => ({ key })),
          },
        }),
      },
      include: { permissions: { select: { id: true, key: true } } },
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.accessGroup.delete({ where: { id } });
  }

  async getUserIdsInGroup(groupId: string): Promise<string[]> {
    const users = await this.db.user.findMany({
      where: { accessGroupId: groupId },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }
}
