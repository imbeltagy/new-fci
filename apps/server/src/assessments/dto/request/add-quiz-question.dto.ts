import { ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsString, Min } from "class-validator";

export class AddQuizQuestionDto {
  @IsString()
  @IsNotEmpty()
  text!: string;

  @IsInt()
  @Min(1)
  degree: number = 1;

  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  options!: string[];

  @IsInt()
  @Min(0)
  correctOption!: number;
}
