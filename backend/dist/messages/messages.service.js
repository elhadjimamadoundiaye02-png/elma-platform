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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
const role_enum_1 = require("../common/enums/role.enum");
let MessagesService = class MessagesService {
    constructor(prisma, realtime) {
        this.prisma = prisma;
        this.realtime = realtime;
    }
    async assertParticipant(ticketId, userId, role) {
        const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket introuvable.');
        const estParticipant = role === role_enum_1.Role.ADMIN || ticket.clientId === userId || ticket.technicienId === userId;
        if (!estParticipant) {
            throw new common_1.ForbiddenException("Vous n'êtes pas rattaché à ce ticket.");
        }
        return ticket;
    }
    async findByTicket(ticketId, userId, role) {
        await this.assertParticipant(ticketId, userId, role);
        return this.prisma.message.findMany({
            where: { ticketId },
            orderBy: { createdAt: 'asc' },
            include: { auteur: { select: { id: true, nom: true, prenom: true, role: true } } },
        });
    }
    async create(ticketId, auteurId, role, contenu) {
        await this.assertParticipant(ticketId, auteurId, role);
        const message = await this.prisma.message.create({
            data: { ticketId, auteurId, contenu },
            include: { auteur: { select: { id: true, nom: true, prenom: true, role: true } } },
        });
        this.realtime.emitNewMessage(ticketId, message);
        return message;
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        realtime_gateway_1.RealtimeGateway])
], MessagesService);
//# sourceMappingURL=messages.service.js.map