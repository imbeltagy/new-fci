import { IsEnum, IsNotEmpty, IsString, IsUUID } from "class-validator";

import { Semester } from "@prisma/client";

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(Semester)
  semester!: Semester;

  @IsUUID()
  joinYearId!: string;

  @IsUUID()
  majorId!: string;
}
