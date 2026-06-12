export class AuthUserDto {
  id!: string;
  email!: string;
  name!: string;
  role!: string;
  mustChangePassword!: boolean;
}

export class ClientLoginResponse {
  accessToken!: string;
  refreshToken!: string;
  user!: AuthUserDto;
}

export class AdminLoginResponse {
  user!: AuthUserDto;
}

export class TokenPairResponse {
  accessToken!: string;
  refreshToken!: string;
}

export class AdminRefreshResponse {
  user!: Pick<AuthUserDto, "id" | "email" | "name" | "role">;
}

export class ChangePasswordResponse {
  user!: Pick<AuthUserDto, "id" | "email">;
  // accessToken and refreshToken present for client; absent for admin
  accessToken?: string;
  refreshToken?: string;
}
