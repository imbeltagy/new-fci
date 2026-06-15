import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsInt, IsUUID, Min, ValidateNested } from "class-validator";

class QuizAnswerDto {
  @IsUUID()
  questionId!: string;

  @IsInt()
  @Min(0)
  selectedOption!: number;
}

export class SubmitQuizDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers!: QuizAnswerDto[];
}
