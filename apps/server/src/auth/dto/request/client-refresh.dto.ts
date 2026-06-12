import { IsNotEmpty, IsString } from "class-validator";

export class ClientRefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
