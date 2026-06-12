import { IsArray, IsUUID } from "class-validator";

export class SendCredentialsDto {
  @IsArray()
  @IsUUID("4", { each: true })
  userIds!: string[];
}
