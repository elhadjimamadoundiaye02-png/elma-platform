import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { SessionsService } from './sessions.service';

// CORS aligné sur FRONTEND_URL ; en production, l'adapter Redis (@socket.io/redis-adapter)
// est branché sur cette instance dans main.ts pour permettre le scaling horizontal
// (plusieurs pods/instances Node.js partageant le même bus d'événements).
@Injectable()
@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL, credentials: true } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('RealtimeGateway');

  constructor(private sessionsService: SessionsService) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Connexion : ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    await this.sessionsService.remove(client.id);
    this.server.to('admin').emit('admin:sessions_update', await this.sessionsService.findAll());
  }

  // Émis par le client juste après l'authentification (avec le user décodé côté front)
  @SubscribeMessage('session:connect')
  async onSessionConnect(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; nom: string; role: string; page: string },
  ) {
    const ip = client.handshake.address;
    await this.sessionsService.upsert({
      socketId: client.id,
      userId: data.userId,
      nom: data.nom,
      role: data.role,
      ip,
      page: data.page,
      connecteDepuis: Date.now(),
    });

    // Chaque utilisateur rejoint sa propre room pour recevoir ses notifications ciblées
    client.join(`user:${data.userId}`);
    if (data.role === 'admin') client.join('admin');

    this.server.to('admin').emit('admin:sessions_update', await this.sessionsService.findAll());
  }

  @SubscribeMessage('session:page_change')
  async onPageChange(@ConnectedSocket() client: Socket, @MessageBody() data: { page: string }) {
    await this.sessionsService.touch(client.id, data.page);
    this.server.to('admin').emit('admin:sessions_update', await this.sessionsService.findAll());
  }

  @SubscribeMessage('ticket:join')
  onJoinTicket(@ConnectedSocket() client: Socket, @MessageBody() ticketId: string) {
    client.join(`ticket:${ticketId}`);
  }

  // --- Émissions déclenchées depuis les services métier (TicketsService, AdminService) ---

  emitNewTicket(ticket: any) {
    this.server.to('admin').emit('ticket:new', ticket);
  }

  emitStatusChange(ticket: any) {
    this.server.to(`user:${ticket.clientId}`).emit('ticket:status_changed', {
      ticket_id: ticket.id,
      nouveau_statut: ticket.statut,
    });
    if (ticket.technicienId) {
      this.server.to(`user:${ticket.technicienId}`).emit('ticket:status_changed', {
        ticket_id: ticket.id,
        nouveau_statut: ticket.statut,
      });
    }
    this.server.to('admin').emit('ticket:status_changed', {
      ticket_id: ticket.id,
      nouveau_statut: ticket.statut,
    });
  }

  // Diffuse un nouveau message à tous les participants connectés à ce ticket
  // (room rejointe côté client via l'event `ticket:join`, cf. onJoinTicket ci-dessus).
  emitNewMessage(ticketId: string, message: any) {
    this.server.to(`ticket:${ticketId}`).emit('message:new', message);
  }

  async invalidateSession(socketId: string) {
    this.server.to(socketId).emit('admin:session_invalidated', { reason: 'Invalidée par un administrateur' });
    this.server.sockets.sockets.get(socketId)?.disconnect(true);
    await this.sessionsService.remove(socketId);
  }
}
