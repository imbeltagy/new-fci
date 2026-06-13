export type UserRole = "student" | "teacher" | "sub_teacher" | "it" | "superadmin";

export interface UserFileRef {
  id: string;
  url: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  avatar: UserFileRef | null;
  cover: UserFileRef | null;
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
  avatar?: File;
  cover?: File;
  whatsapp?: string;
}

export interface ListUsersFilter {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
  accessGroupId?: string;
}
