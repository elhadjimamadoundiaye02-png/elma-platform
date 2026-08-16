import { IsUUID, IsNumber, IsPositive, IsEnum, IsOptional } from 'class-validator';
import { TypeFactureDevis } from '@prisma/client';

export class CreateFactureDto {
  @IsUUID()
  ticketId: string;

  @IsEnum(TypeFactureDevis)
  type: TypeFactureDevis;

  @IsNumber()
  @IsPositive()
  montantTotal: number;

  @IsOptional()
  @IsEnum(['en_attente', 'paye', 'annule'])
  statutPaiement?: 'en_attente' | 'paye' | 'annule';
}
