import { IsInt, IsOptional, Max, Min } from "class-validator";

export class UpdateJoinYearDto {
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;
}
