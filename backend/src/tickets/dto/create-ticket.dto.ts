import { IsEnum, IsString, IsOptional, IsDateString } from 'class-validator';
import { ModeIntervention } from '@prisma/client';

export class CreateTicketDto {
  @IsString()
  typeService: string;

  @IsEnum(ModeIntervention)
  modeIntervention: ModeIntervention;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  adresseIntervention?: string;

  @IsOptional()
  @IsDateString()
  dateRdv?: string;

  @IsOptional()
  @IsString()
  plageHoraire?: string;
}
