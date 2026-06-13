export type UserRole = "student" | "teacher" | "sub_teacher" | "it" | "superadmin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  avatarUrl: string | null;
  coverUrl: string | null;
  whatsapp: string | null;
  accessGroupId: string | null;
  joinYearId: string | null;
  majorId: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateUserBody {
  email: string;
  name: string;
  role: Exclude<UserRole, "superadmin">;
  joinYearId?: string;
  majorId?: string;
}

export interface UpdateUserBody {
  role?: Exclude<UserRole, "superadmin">;
  isActive?: boolean;
  joinYearId?: string;
  majorId?: string;
  accessGroupId?: string | null;
}

export interface UpdateMeBody {
  name?: string;
  avatarUrl?: string;
  coverUrl?: string;
  whatsapp?: string;
}

export interface ListUsersFilter {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
  accessGroupId?: string;
}
