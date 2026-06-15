import { Transform } from "class-transformer";
import { IsBoolean, IsDate, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class UpdateAssessmentDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @Transform(({ value }) => new Date(value as string))
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Transform(({ value }) => new Date(value as string))
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalMark?: number;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsOptional()
  @IsBoolean()
  markReadable?: boolean;
}
