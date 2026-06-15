import { Transform } from "class-transformer";
import { IsDate, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from "class-validator";

export enum AssessmentTypeDto {
  quiz = "quiz",
  assignment = "assignment",
}

export class CreateAssessmentDto {
  @IsEnum(AssessmentTypeDto)
  type!: AssessmentTypeDto;

  @IsUUID()
  subjectId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @Transform(({ value }) => new Date(value as string))
  @IsDate()
  startDate!: Date;

  @Transform(({ value }) => new Date(value as string))
  @IsDate()
  endDate!: Date;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalMark?: number;
}
