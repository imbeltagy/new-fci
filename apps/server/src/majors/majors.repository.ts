import { getPrismaClient } from "../db/postgres";

export class MajorsRepository {
  private get db() {
    return getPrismaClient();
  }

  async findAll() {
    return this.db.major.findMany({ orderBy: { name: "asc" } });
  }

  async findById(id: string) {
    return this.db.major.findUnique({ where: { id } });
  }

  async findByCode(code: string) {
    return this.db.major.findUnique({ where: { code } });
  }

  async create(data: { name: string; code: string }) {
    return this.db.major.create({ data });
  }

  async update(id: string, data: { name?: string; code?: string }) {
    return this.db.major.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.db.major.delete({ where: { id } });
  }

  async findStaff(majorId: string, joinYearId?: string) {
    return this.db.staffMajorAssignment.findMany({
      where: { majorId, ...(joinYearId && { joinYearId }) },
      include: {
        user: { select: { id: true, name: true, role: true } },
        joinYear: { select: { id: true, year: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async assignStaff(userId: string, majorId: string, joinYearId: string) {
    return this.db.staffMajorAssignment.create({
      data: { userId, majorId, joinYearId },
    });
  }

  async removeStaff(userId: string, majorId: string, joinYearId: string) {
    await this.db.staffMajorAssignment.deleteMany({
      where: { userId, majorId, joinYearId },
    });
  }

  // ── Detail (client-facing) ──────────────────────────────────────────────

  async findDetail(majorId: string, joinYearId: string) {
    const avatar = { select: { id: true, url: true } } as const;

    const [major, joinYear, subjects, teachers, students, room] = await Promise.all([
      this.db.major.findUnique({ where: { id: majorId } }),
      this.db.joinYear.findUnique({ where: { id: joinYearId }, select: { id: true, year: true } }),
      this.db.subject.findMany({
        where: { majorId, joinYearId },
        select: { id: true, code: true, name: true, semester: true },
        orderBy: { name: "asc" },
      }),
      this.db.staffMajorAssignment.findMany({
        where: { majorId, joinYearId },
        include: { user: { select: { id: true, name: true, email: true, role: true, avatar } } },
        orderBy: { createdAt: "asc" },
      }),
      this.db.user.findMany({
        where: { role: "student", majorId, joinYearId },
        select: { id: true, name: true, email: true, avatar },
        orderBy: { name: "asc" },
      }),
      this.db.room.findFirst({
        where: { type: "major_channel", majorId, joinYearId },
        select: { id: true },
      }),
    ]);

    return { major, joinYear, subjects, teachers, students, room };
  }

  async isStaffOfMajor(userId: string, majorId: string, joinYearId: string) {
    const row = await this.db.staffMajorAssignment.findUnique({
      where: { userId_majorId_joinYearId: { userId, majorId, joinYearId } },
      select: { id: true },
    });
    return !!row;
  }
}
