export class PermissionResponse {
  id!: string;
  key!: string;
}

export class AccessGroupResponse {
  id!: string;
  name!: string;
  description!: string | null;
  permissions!: PermissionResponse[];
  createdAt!: Date;
  updatedAt!: Date;
}
