import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { SessionsService } from '../realtime/sessions.service';
export declare class AdminService {
    private prisma;
    private realtime;
    private sessions;
    constructor(prisma: PrismaService, realtime: RealtimeGateway, sessions: SessionsService);
    getLiveSessions(): Promise<import("../realtime/sessions.service").LiveSession[]>;
    invalidateSession(socketId: string): Promise<{
        message: string;
    }>;
    statsOverview(): Promise<{
        ticketsOuverts: any;
        ticketsTermines: any;
        techniciensActifs: any;
        revenuTotal: any;
        enLigne: number;
    }>;
    statsRepartition(): Promise<any>;
}
