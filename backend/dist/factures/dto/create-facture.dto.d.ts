import { TypeFactureDevis } from '@prisma/client';
export declare class CreateFactureDto {
    ticketId: string;
    type: TypeFactureDevis;
    montantTotal: number;
    statutPaiement?: 'en_attente' | 'paye' | 'annule';
}
