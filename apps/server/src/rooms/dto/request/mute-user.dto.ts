import { IsDateString, IsOptional } from "class-validator";

export class MuteUserDto {
  /** Omit for a permanent mute; otherwise an ISO date when the mute expires. */
  @IsOptional()
  @IsDateString()
  mutedUntil?: string;
}
