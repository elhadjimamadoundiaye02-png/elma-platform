"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const sessions_service_1 = require("./sessions.service");
let RealtimeGateway = class RealtimeGateway {
    constructor(sessionsService) {
        this.sessionsService = sessionsService;
        this.logger = new common_1.Logger('RealtimeGateway');
    }
    async handleConnection(client) {
        this.logger.log(`Connexion : ${client.id}`);
    }
    async handleDisconnect(client) {
        await this.sessionsService.remove(client.id);
        this.server.to('admin').emit('admin:sessions_update', await this.sessionsService.findAll());
    }
    async onSessionConnect(client, data) {
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
        client.join(`user:${data.userId}`);
        if (data.role === 'admin')
            client.join('admin');
        this.server.to('admin').emit('admin:sessions_update', await this.sessionsService.findAll());
    }
    async onPageChange(client, data) {
        await this.sessionsService.touch(client.id, data.page);
        this.server.to('admin').emit('admin:sessions_update', await this.sessionsService.findAll());
    }
    onJoinTicket(client, ticketId) {
        client.join(`ticket:${ticketId}`);
    }
    emitNewTicket(ticket) {
        this.server.to('admin').emit('ticket:new', ticket);
    }
    emitStatusChange(ticket) {
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
    emitNewMessage(ticketId, message) {
        this.server.to(`ticket:${ticketId}`).emit('message:new', message);
    }
    async invalidateSession(socketId) {
        this.server.to(socketId).emit('admin:session_invalidated', { reason: 'Invalidée par un administrateur' });
        this.server.sockets.sockets.get(socketId)?.disconnect(true);
        await this.sessionsService.remove(socketId);
    }
};
exports.RealtimeGateway = RealtimeGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], RealtimeGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('session:connect'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "onSessionConnect", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('session:page_change'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "onPageChange", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ticket:join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "onJoinTicket", null);
exports.RealtimeGateway = RealtimeGateway = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({ cors: { origin: process.env.FRONTEND_URL, credentials: true } }),
    __metadata("design:paramtypes", [sessions_service_1.SessionsService])
], RealtimeGateway);
//# sourceMappingURL=realtime.gateway.js.map