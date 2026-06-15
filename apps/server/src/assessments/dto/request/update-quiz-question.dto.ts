import { ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class UpdateQuizQuestionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  text?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  degree?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  correctOption?: number;
}
