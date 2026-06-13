export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  mustChangePassword: boolean;
}

export interface ClientLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface AdminLoginResponse {
  user: AuthUser;
}

export interface TokenPairResponse {
  accessToken: string;
  refreshToken: string;
}

export interface AdminRefreshResponse {
  user: Pick<AuthUser, "id" | "email" | "name" | "role">;
}

export interface ChangePasswordResponse {
  user: Pick<AuthUser, "id" | "email">;
  accessToken?: string;
  refreshToken?: string;
}
