import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SessionsService } from './sessions.service';
export declare class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private sessionsService;
    server: Server;
    private logger;
    constructor(sessionsService: SessionsService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    onSessionConnect(client: Socket, data: {
        userId: string;
        nom: string;
        role: string;
        page: string;
    }): Promise<void>;
    onPageChange(client: Socket, data: {
        page: string;
    }): Promise<void>;
    onJoinTicket(client: Socket, ticketId: string): void;
    emitNewTicket(ticket: any): void;
    emitStatusChange(ticket: any): void;
    emitNewMessage(ticketId: string, message: any): void;
    invalidateSession(socketId: string): Promise<void>;
}
