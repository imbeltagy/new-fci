import { IsUUID } from "class-validator";

export class AssignMajorDto {
  @IsUUID()
  majorId!: string;

  @IsUUID()
  joinYearId!: string;
}
