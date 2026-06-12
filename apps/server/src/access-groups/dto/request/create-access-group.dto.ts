import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateAccessGroupDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  permissionKeys!: string[];
}
