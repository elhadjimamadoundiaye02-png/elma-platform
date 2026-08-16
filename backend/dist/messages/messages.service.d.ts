import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { Role } from '../common/enums/role.enum';
export declare class MessagesService {
    private prisma;
    private realtime;
    constructor(prisma: PrismaService, realtime: RealtimeGateway);
    private assertParticipant;
    findByTicket(ticketId: string, userId: string, role: Role): Promise<any>;
    create(ticketId: string, auteurId: string, role: Role, contenu: string): Promise<any>;
}
