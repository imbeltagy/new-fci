import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

import { RoomType } from "@prisma/client";

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(RoomType)
  type!: RoomType;

  @IsOptional()
  @IsUUID()
  joinYearId?: string;

  @IsOptional()
  @IsUUID()
  majorId?: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;
}
