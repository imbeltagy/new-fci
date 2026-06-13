import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

import { Semester } from "@prisma/client";

export class UpdateSubjectDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  code?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsEnum(Semester)
  semester?: Semester;
}
