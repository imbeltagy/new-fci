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
}
