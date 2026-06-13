import { IsInt, Min, Max } from "class-validator";

export class CreateJoinYearDto {
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;
}
