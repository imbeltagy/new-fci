import { IsUUID } from "class-validator";

export class AssignStaffToSubjectDto {
  @IsUUID()
  userId!: string;
}
