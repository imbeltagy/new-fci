import { Permission } from "../config/permissions.config";
import { deleteUserSessions } from "../lib/session";
import type { CreateAccessGroupDto } from "./dto/request/create-access-group.dto";
import type { UpdateAccessGroupDto } from "./dto/request/update-access-group.dto";
import { AccessGroupsRepository } from "./access-groups.repository";

const VALID_PERMISSION_KEYS = new Set<string>(Object.values(Permission));

const validateKeys = (keys: string[]) => {
  const invalid = keys.filter((k) => !VALID_PERMISSION_KEYS.has(k));
  if (invalid.length > 0) {
    throw Object.assign(
      new Error(`Unknown permission keys: ${invalid.join(", ")}`),
      { status: 400 },
    );
  }
};

export class AccessGroupsService {
  constructor(private readonly repo = new AccessGroupsRepository()) {}

  async listGroups() {
    return this.repo.findAll();
  }

  async getGroup(id: string) {
    const group = await this.repo.findById(id);
    if (!group) throw Object.assign(new Error("Access group not found"), { status: 404 });
    return group;
  }

  async createGroup(dto: CreateAccessGroupDto) {
    validateKeys(dto.permissionKeys);
    return this.repo.create(dto);
  }

  async updateGroup(id: string, dto: UpdateAccessGroupDto) {
    if (dto.permissionKeys) validateKeys(dto.permissionKeys);

    if (dto.permissionKeys) {
      const userIds = await this.repo.getUserIdsInGroup(id);
      await deleteUserSessions(userIds);
    }

    const group = await this.repo.update(id, dto);
    if (!group) throw Object.assign(new Error("Access group not found"), { status: 404 });
    return group;
  }

  async deleteGroup(id: string): Promise<void> {
    const userIds = await this.repo.getUserIdsInGroup(id);
    await deleteUserSessions(userIds);
    await this.repo.delete(id);
  }
}
