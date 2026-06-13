import { IsEnum, IsOptional, IsString } from "class-validator";

import { TicketStatus } from "@prisma/client";

export class UpdateTicketStatusDto {
  @IsEnum(TicketStatus)
  status!: TicketStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
