import { IsUUID } from "class-validator";

export class AssignStaffToMajorDto {
  @IsUUID()
  userId!: string;

  @IsUUID()
  joinYearId!: string;
}
