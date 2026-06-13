import { Semester } from "@prisma/client";

import { getPrismaClient } from "../db/postgres";

const subjectSelect = {
  id: true,
  code: true,
  name: true,
  semester: true,
  joinYearId: true,
  joinYear: { select: { id: true, year: true } },
  majorId: true,
  major: { select: { id: true, name: true, code: true } },
  createdAt: true,
  updatedAt: true,
} as const;

export class SubjectsRepository {
  private get db() {
    return getPrismaClient();
  }

  async findAll(filter?: { joinYearId?: string; majorId?: string }) {
    return this.db.subject.findMany({
      where: {
        ...(filter?.joinYearId && { joinYearId: filter.joinYearId }),
        ...(filter?.majorId && { majorId: filter.majorId }),
      },
      select: subjectSelect,
      orderBy: [{ joinYear: { year: "desc" } }, { name: "asc" }],
    });
  }

  async findById(id: string) {
    return this.db.subject.findUnique({ where: { id }, select: subjectSelect });
  }

  async findByCode(code: string) {
    return this.db.subject.findUnique({ where: { code } });
  }

  async create(data: { code: string; name: string; semester: Semester; joinYearId: string; majorId: string }) {
    return this.db.subject.create({ data, select: subjectSelect });
  }

  async update(id: string, data: { code?: string; name?: string; semester?: Semester }) {
    return this.db.subject.update({ where: { id }, data, select: subjectSelect });
  }

  async delete(id: string) {
    await this.db.subject.delete({ where: { id } });
  }

  async findStaff(subjectId: string) {
    return this.db.staffSubjectAssignment.findMany({
      where: { subjectId },
      include: { user: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  async assignStaff(userId: string, subjectId: string) {
    return this.db.staffSubjectAssignment.create({ data: { userId, subjectId } });
  }

  async removeStaff(userId: string, subjectId: string) {
    await this.db.staffSubjectAssignment.deleteMany({ where: { userId, subjectId } });
  }

  async findEnrollments(subjectId: string) {
    return this.db.subjectEnrollment.findMany({
      where: { subjectId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  async enrollStudent(userId: string, subjectId: string) {
    return this.db.subjectEnrollment.create({ data: { userId, subjectId } });
  }

  async bulkEnroll(userIds: string[], subjectId: string) {
    return this.db.subjectEnrollment.createMany({
      data: userIds.map((userId) => ({ userId, subjectId })),
      skipDuplicates: true,
    });
  }

  async unenrollStudent(userId: string, subjectId: string) {
    await this.db.subjectEnrollment.deleteMany({ where: { userId, subjectId } });
  }

  async findStudentsByJoinYearAndMajor(joinYearId: string, majorId: string) {
    return this.db.user.findMany({
      where: { role: "student", joinYearId, majorId },
      select: { id: true },
    });
  }

  // ── Detail (client-facing) ──────────────────────────────────────────────

  async findDetail(subjectId: string) {
    return this.db.subject.findUnique({
      where: { id: subjectId },
      select: {
        ...subjectSelect,
        room: { select: { id: true } },
        staffAssignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
                avatar: { select: { id: true, url: true } },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: { select: { id: true, url: true } },
              },
            },
          },
          orderBy: { user: { name: "asc" } },
        },
      },
    });
  }

  async isEnrolled(userId: string, subjectId: string) {
    const row = await this.db.subjectEnrollment.findUnique({
      where: { userId_subjectId: { userId, subjectId } },
      select: { id: true },
    });
    return !!row;
  }

  async isStaffAssigned(userId: string, subjectId: string) {
    const row = await this.db.staffSubjectAssignment.findUnique({
      where: { userId_subjectId: { userId, subjectId } },
      select: { id: true },
    });
    return !!row;
  }
}
