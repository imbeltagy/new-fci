import type { CreateJoinYearDto } from "./dto/request/create-join-year.dto";
import type { UpdateJoinYearDto } from "./dto/request/update-join-year.dto";
import { JoinYearsRepository } from "./join-years.repository";

export class JoinYearsService {
  constructor(private readonly repo = new JoinYearsRepository()) {}

  async listJoinYears() {
    return this.repo.findAll();
  }

  async getJoinYear(id: string) {
    const jy = await this.repo.findById(id);
    if (!jy) throw Object.assign(new Error("Join year not found"), { status: 404 });
    return jy;
  }

  async createJoinYear(dto: CreateJoinYearDto) {
    const existing = await this.repo.findByYear(dto.year);
    if (existing) throw Object.assign(new Error(`Join year ${dto.year} already exists`), { status: 409 });
    return this.repo.create(dto.year);
  }

  async updateJoinYear(id: string, dto: UpdateJoinYearDto) {
    await this.getJoinYear(id);
    if (dto.year !== undefined) {
      const existing = await this.repo.findByYear(dto.year);
      if (existing && existing.id !== id) {
        throw Object.assign(new Error(`Join year ${dto.year} already exists`), { status: 409 });
      }
    }
    return this.repo.update(id, dto.year!);
  }

  async deleteJoinYear(id: string) {
    await this.getJoinYear(id);
    await this.repo.delete(id);
  }
}
