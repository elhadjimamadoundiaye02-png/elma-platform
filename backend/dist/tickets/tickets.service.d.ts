import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { Role } from '../common/enums/role.enum';
import { StatutTicket } from '@prisma/client';
export declare class TicketsService {
    private prisma;
    private realtime;
    constructor(prisma: PrismaService, realtime: RealtimeGateway);
    private generateReference;
    create(clientId: string, dto: CreateTicketDto): Promise<any>;
    findForUser(userId: string, role: Role): any;
    findOne(id: string, userId: string, role: Role): Promise<any>;
    updateStatus(id: string, nouveauStatut: StatutTicket, modifieParId: string): Promise<any>;
    assignTechnician(id: string, technicienId: string): any;
}
