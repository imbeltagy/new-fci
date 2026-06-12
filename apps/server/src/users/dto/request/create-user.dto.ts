import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

import { Role } from "@prisma/client";

const creatableRoles = [Role.student, Role.teacher, Role.sub_teacher, Role.it] as const;

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(creatableRoles)
  role!: (typeof creatableRoles)[number];

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  joinYearId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  majorId?: string;
}
