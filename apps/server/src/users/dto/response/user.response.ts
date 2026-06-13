export class FileRef {
  id!: string;
  url!: string;
}

export class UserResponse {
  id!: string;
  email!: string;
  name!: string;
  role!: string;
  isActive!: boolean;
  mustChangePassword!: boolean;
  avatar!: FileRef | null;
  cover!: FileRef | null;
  whatsapp!: string | null;
  accessGroupId!: string | null;
  joinYearId!: string | null;
  majorId!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
