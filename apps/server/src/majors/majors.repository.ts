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
}
