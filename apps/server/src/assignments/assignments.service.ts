import { getPrismaClient } from "../db/postgres";
import type { AssignMajorDto } from "./dto/request/assign-major.dto";
import { AssignmentsRepository } from "./assignments.repository";

export class AssignmentsService {
  constructor(private readonly repo = new AssignmentsRepository()) {}

  private async requireStaff(userId: string) {
    const user = await getPrismaClient().user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
    if (user.role !== "teacher" && user.role !== "sub_teacher") {
      throw Object.assign(new Error("User must be a teacher or sub-teacher"), { status: 400 });
    }
    return user;
  }

  async getAssignments(userId: string) {
    await this.requireStaff(userId);
    return this.repo.findAllForUser(userId);
  }

  async assignJoinYear(userId: string, joinYearId: string) {
    await this.requireStaff(userId);
    return this.repo.assignJoinYear(userId, joinYearId);
  }

  async removeJoinYear(userId: string, joinYearId: string) {
    await this.requireStaff(userId);
    await this.repo.removeJoinYear(userId, joinYearId);
  }

  async assignMajor(userId: string, dto: AssignMajorDto) {
    await this.requireStaff(userId);
    return this.repo.assignMajor(userId, dto.majorId, dto.joinYearId);
  }

  async removeMajor(userId: string, majorId: string, joinYearId: string) {
    await this.requireStaff(userId);
    await this.repo.removeMajor(userId, majorId, joinYearId);
  }

  async assignSubject(userId: string, subjectId: string) {
    await this.requireStaff(userId);
    return this.repo.assignSubject(userId, subjectId);
  }

  async removeSubject(userId: string, subjectId: string) {
    await this.requireStaff(userId);
    await this.repo.removeSubject(userId, subjectId);
  }
}
