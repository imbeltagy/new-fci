import { IsInt, Min } from "class-validator";

export class GradeAssignmentDto {
  @IsInt()
  @Min(0)
  mark!: number;
}
