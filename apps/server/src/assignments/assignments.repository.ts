import { getPrismaClient } from "../db/postgres";

export class AssignmentsRepository {
  private get db() {
    return getPrismaClient();
  }

  async findAllForUser(userId: string) {
    const [joinYears, majors, subjects] = await Promise.all([
      this.db.staffJoinYearAssignment.findMany({
        where: { userId },
        include: { joinYear: { select: { id: true, year: true } } },
        orderBy: { joinYear: { year: "desc" } },
      }),
      this.db.staffMajorAssignment.findMany({
        where: { userId },
        include: {
          major: { select: { id: true, name: true, code: true } },
          joinYear: { select: { id: true, year: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      this.db.staffSubjectAssignment.findMany({
        where: { userId },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
              semester: true,
              joinYear: { select: { id: true, year: true } },
              major: { select: { id: true, name: true, code: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);
    return { joinYears, majors, subjects };
  }

  async assignJoinYear(userId: string, joinYearId: string) {
    return this.db.staffJoinYearAssignment.create({ data: { userId, joinYearId } });
  }

  async removeJoinYear(userId: string, joinYearId: string) {
    await this.db.staffJoinYearAssignment.deleteMany({ where: { userId, joinYearId } });
  }

  async assignMajor(userId: string, majorId: string, joinYearId: string) {
    return this.db.staffMajorAssignment.create({ data: { userId, majorId, joinYearId } });
  }

  async removeMajor(userId: string, majorId: string, joinYearId: string) {
    await this.db.staffMajorAssignment.deleteMany({ where: { userId, majorId, joinYearId } });
  }

  async assignSubject(userId: string, subjectId: string) {
    return this.db.staffSubjectAssignment.create({ data: { userId, subjectId } });
  }

  async removeSubject(userId: string, subjectId: string) {
    await this.db.staffSubjectAssignment.deleteMany({ where: { userId, subjectId } });
  }
}
