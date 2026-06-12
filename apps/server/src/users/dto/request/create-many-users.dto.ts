import { IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

import { CreateUserDto } from "./create-user.dto";

export class CreateManyUsersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUserDto)
  users!: CreateUserDto[];
}
