import { IsNotEmpty, IsString, Matches } from "class-validator";

export class CreateMajorDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @Matches(/^[A-Z0-9_-]+$/, { message: "code must be uppercase letters, digits, underscores or dashes" })
  code!: string;
}
