import { IsEnum } from 'class-validator';
import { StatutTicket } from '@prisma/client';

export class UpdateStatusDto {
  @IsEnum(StatutTicket)
  statut: StatutTicket;
}
