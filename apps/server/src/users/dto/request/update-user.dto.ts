import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateIf } from "class-validator";

import { Role } from "@prisma/client";

const updatableRoles = [Role.student, Role.teacher, Role.sub_teacher, Role.it] as const;

export class UpdateUserDto {
  @IsOptional()
  @IsEnum(updatableRoles)
  role?: (typeof updatableRoles)[number];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  joinYearId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  majorId?: string;

  // null removes the access group; a UUID assigns one
  @IsOptional()
  @ValidateIf((o) => o.accessGroupId !== null)
  @IsUUID()
  accessGroupId?: string | null;
}
