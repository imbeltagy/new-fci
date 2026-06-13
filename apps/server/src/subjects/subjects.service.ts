import type { AssignStaffToSubjectDto } from "./dto/request/assign-staff.dto";
import type { CreateSubjectDto } from "./dto/request/create-subject.dto";
import type { UpdateSubjectDto } from "./dto/request/update-subject.dto";
import { SubjectsRepository } from "./subjects.repository";

export class SubjectsService {
  constructor(private readonly repo = new SubjectsRepository()) {}

  async listSubjects(filter?: { joinYearId?: string; majorId?: string }) {
    return this.repo.findAll(filter);
  }

  async getSubject(id: string) {
    const subject = await this.repo.findById(id);
    if (!subject) throw Object.assign(new Error("Subject not found"), { status: 404 });
    return subject;
  }

  async createSubject(dto: CreateSubjectDto) {
    const existing = await this.repo.findByCode(dto.code);
    if (existing) throw Object.assign(new Error(`Subject with code "${dto.code}" already exists`), { status: 409 });
    return this.repo.create(dto);
  }

  async updateSubject(id: string, dto: UpdateSubjectDto) {
    await this.getSubject(id);
    if (dto.code) {
      const existing = await this.repo.findByCode(dto.code);
      if (existing && existing.id !== id) {
        throw Object.assign(new Error(`Subject with code "${dto.code}" already exists`), { status: 409 });
      }
    }
    return this.repo.update(id, dto);
  }

  async deleteSubject(id: string) {
    await this.getSubject(id);
    await this.repo.delete(id);
  }

  async getStaff(subjectId: string) {
    await this.getSubject(subjectId);
    return this.repo.findStaff(subjectId);
  }

  async assignStaff(subjectId: string, dto: AssignStaffToSubjectDto) {
    await this.getSubject(subjectId);
    return this.repo.assignStaff(dto.userId, subjectId);
  }

  async removeStaff(subjectId: string, userId: string) {
    await this.repo.removeStaff(userId, subjectId);
  }

  async getEnrollments(subjectId: string) {
    await this.getSubject(subjectId);
    return this.repo.findEnrollments(subjectId);
  }

  async enrollStudent(subjectId: string, userId: string) {
    await this.getSubject(subjectId);
    return this.repo.enrollStudent(userId, subjectId);
  }

  async bulkEnroll(subjectId: string) {
    const subject = await this.getSubject(subjectId);
    const students = await this.repo.findStudentsByJoinYearAndMajor(
      subject.joinYearId,
      subject.majorId,
    );
    return this.repo.bulkEnroll(students.map((s) => s.id), subjectId);
  }

  async unenrollStudent(subjectId: string, userId: string) {
    await this.repo.unenrollStudent(userId, subjectId);
  }

  async getSubjectDetail(
    subjectId: string,
    userId: string,
    role: string,
    isAdmin: boolean,
  ) {
    const detail = await this.repo.findDetail(subjectId);
    if (!detail) throw Object.assign(new Error("Subject not found"), { status: 404 });

    if (!isAdmin) {
      const allowed =
        role === "student"
          ? await this.repo.isEnrolled(userId, subjectId)
          : await this.repo.isStaffAssigned(userId, subjectId);
      if (!allowed) {
        throw Object.assign(new Error("You don't have access to this subject"), { status: 403 });
      }
    }

    return {
      subject: {
        id: detail.id,
        code: detail.code,
        name: detail.name,
        semester: detail.semester,
        major: detail.major,
        joinYear: detail.joinYear,
      },
      channelId: detail.room?.id ?? null,
      staff: detail.staffAssignments.map((a) => ({
        id: a.user.id,
        name: a.user.name,
        role: a.user.role,
        avatarUrl: a.user.avatar?.url ?? null,
      })),
      students: detail.enrollments.map((e) => ({
        id: e.user.id,
        name: e.user.name,
        email: e.user.email,
        avatarUrl: e.user.avatar?.url ?? null,
      })),
    };
  }
}
