import { IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";

export class UpdateMajorDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9_-]+$/, { message: "code must be uppercase letters, digits, underscores or dashes" })
  code?: string;
}
