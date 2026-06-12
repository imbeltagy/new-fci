import { IsNotEmpty, IsString, Matches, MinLength } from "class-validator";

export class ConfirmPasswordResetDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: "newPassword must contain uppercase, lowercase and a digit",
  })
  newPassword!: string;
}
