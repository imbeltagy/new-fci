export class UserResponse {
  id!: string;
  email!: string;
  name!: string;
  role!: string;
  isActive!: boolean;
  mustChangePassword!: boolean;
  avatarUrl!: string | null;
  coverUrl!: string | null;
  whatsapp!: string | null;
  accessGroupId!: string | null;
  joinYearId!: string | null;
  majorId!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
