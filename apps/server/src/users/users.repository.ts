import type { Role, User } from "@prisma/client";

import { getPrismaClient } from "../db/postgres";

interface ListUsersFilter {
  role?: Role;
  isActive?: boolean;
  search?: string;
  accessGroupId?: string;
  excludeRoles?: Role[];
}

export class UsersRepository {
  private get db() {
    return getPrismaClient();
  }

  async findAll(filter: ListUsersFilter) {
    const roleFilter =
      filter.excludeRoles?.length
        ? {
            ...(filter.role && { equals: filter.role }),
            notIn: filter.excludeRoles,
          }
        : filter.role ?? undefined;

    return this.db.user.findMany({
      where: {
        ...(roleFilter !== undefined && { role: roleFilter }),
        ...(filter.isActive !== undefined && { isActive: filter.isActive }),
        ...(filter.accessGroupId && { accessGroupId: filter.accessGroupId }),
        ...(filter.search && {
          OR: [
            { name: { contains: filter.search, mode: "insensitive" } },
            { email: { contains: filter.search, mode: "insensitive" } },
          ],
        }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        sendOnce: true,
        mustChangePassword: true,
        avatarUrl: true,
        coverUrl: true,
        joinYearId: true,
        majorId: true,
        accessGroupId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    return this.db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        sendOnce: true,
        mustChangePassword: true,
        avatarUrl: true,
        coverUrl: true,
        whatsapp: true,
        joinYearId: true,
        majorId: true,
        accessGroupId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    tempPassword: string;
    role: Role;
    name: string;
    joinYearId?: string;
    majorId?: string;
  }): Promise<User> {
    return this.db.user.create({ data });
  }

  async createMany(
    users: {
      email: string;
      passwordHash: string;
      tempPassword: string;
      role: Role;
      name: string;
      joinYearId?: string;
      majorId?: string;
    }[],
  ): Promise<{ count: number }> {
    return this.db.user.createMany({ data: users });
  }

  async updateProfile(
    id: string,
    data: Partial<Pick<User, "name" | "avatarUrl" | "coverUrl" | "whatsapp">>,
  ) {
    return this.db.user.update({ where: { id }, data });
  }

  async adminUpdate(
    id: string,
    data: Partial<
      Pick<User, "role" | "isActive" | "joinYearId" | "majorId" | "accessGroupId">
    >,
  ) {
    return this.db.user.update({ where: { id }, data });
  }

  async findManyByIds(ids: string[]) {
    return this.db.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, email: true, mustChangePassword: true, tempPassword: true },
    });
  }

  async hardDelete(id: string) {
    await this.db.user.delete({ where: { id } });
  }

  async findStudentSubjects(userId: string) {
    return this.db.subjectEnrollment.findMany({
      where: { userId },
      include: {
        subject: {
          select: {
            id: true,
            code: true,
            name: true,
            semester: true,
            joinYear: { select: { id: true, year: true } },
            major: { select: { id: true, name: true, code: true } },
            staffAssignments: {
              include: { user: { select: { id: true, name: true, role: true } } },
            },
          },
        },
      },
      orderBy: { subject: { name: "asc" } },
    });
  }

  async findStaffSubjects(userId: string) {
    const [subjects, majors] = await Promise.all([
      this.db.staffSubjectAssignment.findMany({
        where: { userId },
        include: {
          subject: {
            select: {
              id: true,
              code: true,
              name: true,
              semester: true,
              joinYear: { select: { id: true, year: true } },
              major: { select: { id: true, name: true, code: true } },
            },
          },
        },
        orderBy: { subject: { name: "asc" } },
      }),
      this.db.staffMajorAssignment.findMany({
        where: { userId },
        include: {
          major: { select: { id: true, name: true, code: true } },
          joinYear: { select: { id: true, year: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);
    return { subjects, majorAssignments: majors };
  }
}
