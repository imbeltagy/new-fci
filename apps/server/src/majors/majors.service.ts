import { Role } from "@prisma/client";

import type { AssignStaffToMajorDto } from "./dto/request/assign-staff.dto";
import type { CreateMajorDto } from "./dto/request/create-major.dto";
import type { UpdateMajorDto } from "./dto/request/update-major.dto";
import { MajorsRepository } from "./majors.repository";

const STAFF_ROLES = new Set([Role.teacher, Role.sub_teacher]);

export class MajorsService {
  constructor(private readonly repo = new MajorsRepository()) {}

  async listMajors() {
    return this.repo.findAll();
  }

  async getMajor(id: string) {
    const major = await this.repo.findById(id);
    if (!major) throw Object.assign(new Error("Major not found"), { status: 404 });
    return major;
  }

  async createMajor(dto: CreateMajorDto) {
    const existing = await this.repo.findByCode(dto.code);
    if (existing) throw Object.assign(new Error(`Major with code "${dto.code}" already exists`), { status: 409 });
    return this.repo.create(dto);
  }

  async updateMajor(id: string, dto: UpdateMajorDto) {
    await this.getMajor(id);
    if (dto.code) {
      const existing = await this.repo.findByCode(dto.code);
      if (existing && existing.id !== id) {
        throw Object.assign(new Error(`Major with code "${dto.code}" already exists`), { status: 409 });
      }
    }
    return this.repo.update(id, dto);
  }

  async deleteMajor(id: string) {
    await this.getMajor(id);
    await this.repo.delete(id);
  }

  async getStaff(majorId: string, joinYearId?: string) {
    await this.getMajor(majorId);
    return this.repo.findStaff(majorId, joinYearId);
  }

  async assignStaff(majorId: string, dto: AssignStaffToMajorDto) {
    await this.getMajor(majorId);
    return this.repo.assignStaff(dto.userId, majorId, dto.joinYearId);
  }

  async removeStaff(majorId: string, userId: string, joinYearId: string) {
    await this.repo.removeStaff(userId, majorId, joinYearId);
  }

  async getMajorDetail(
    majorId: string,
    joinYearId: string,
    userId: string,
    role: string,
    isAdmin: boolean,
  ) {
    if (!joinYearId) {
      throw Object.assign(new Error("joinYearId is required"), { status: 400 });
    }

    if (!isAdmin) {
      // Only faculty assigned to this (major × join year) may view it.
      const allowed = await this.repo.isStaffOfMajor(userId, majorId, joinYearId);
      if (!allowed) {
        throw Object.assign(new Error("You don't have access to this major"), { status: 403 });
      }
    }

    const detail = await this.repo.findDetail(majorId, joinYearId);
    if (!detail.major || !detail.joinYear) {
      throw Object.assign(new Error("Major not found"), { status: 404 });
    }

    return {
      major: detail.major,
      joinYear: detail.joinYear,
      channelId: detail.room?.id ?? null,
      subjects: detail.subjects,
      teachers: detail.teachers.map((t) => ({
        id: t.user.id,
        name: t.user.name,
        email: t.user.email,
        role: t.user.role,
        avatarUrl: t.user.avatar?.url ?? null,
      })),
      students: detail.students.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        avatarUrl: s.avatar?.url ?? null,
      })),
    };
  }
}
