import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class SendTicketMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content!: string;
}
