import { ModeIntervention } from '@prisma/client';
export declare class CreateTicketDto {
    typeService: string;
    modeIntervention: ModeIntervention;
    description: string;
    adresseIntervention?: string;
    dateRdv?: string;
    plageHoraire?: string;
}
