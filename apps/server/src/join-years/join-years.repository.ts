import { getPrismaClient } from "../db/postgres";

export class JoinYearsRepository {
  private get db() {
    return getPrismaClient();
  }

  async findAll() {
    return this.db.joinYear.findMany({ orderBy: { year: "desc" } });
  }

  async findById(id: string) {
    return this.db.joinYear.findUnique({ where: { id } });
  }

  async findByYear(year: number) {
    return this.db.joinYear.findUnique({ where: { year } });
  }

  async create(year: number) {
    return this.db.joinYear.create({ data: { year } });
  }

  async update(id: string, year: number) {
    return this.db.joinYear.update({ where: { id }, data: { year } });
  }

  async delete(id: string) {
    await this.db.joinYear.delete({ where: { id } });
  }
}
