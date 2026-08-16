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
exports.TicketsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
const role_enum_1 = require("../common/enums/role.enum");
const client_1 = require("@prisma/client");
let TicketsService = class TicketsService {
    constructor(prisma, realtime) {
        this.prisma = prisma;
        this.realtime = realtime;
    }
    generateReference() {
        const n = Math.floor(1000 + Math.random() * 9000);
        return `ELMA-${new Date().getFullYear()}${n}`;
    }
    async create(clientId, dto) {
        const ticket = await this.prisma.ticket.create({
            data: {
                reference: this.generateReference(),
                clientId,
                typeService: dto.typeService,
                modeIntervention: dto.modeIntervention,
                description: dto.description,
                adresseIntervention: dto.adresseIntervention,
                dateRdv: dto.dateRdv ? new Date(dto.dateRdv) : undefined,
                plageHoraire: dto.plageHoraire,
                qrCodeUrl: dto.modeIntervention === 'atelier' ? `qrcodes/pending-${clientId}` : null,
            },
        });
        this.realtime.emitNewTicket(ticket);
        return ticket;
    }
    findForUser(userId, role) {
        if (role === role_enum_1.Role.ADMIN) {
            return this.prisma.ticket.findMany({ orderBy: { createdAt: 'desc' } });
        }
        if (role === role_enum_1.Role.TECHNICIEN) {
            return this.prisma.ticket.findMany({
                where: { technicienId: userId },
                orderBy: { createdAt: 'desc' },
            });
        }
        return this.prisma.ticket.findMany({
            where: { clientId: userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, userId, role) {
        const ticket = await this.prisma.ticket.findUnique({ where: { id } });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket introuvable.');
        const estAutorise = role === role_enum_1.Role.ADMIN || ticket.clientId === userId || ticket.technicienId === userId;
        if (!estAutorise)
            throw new common_1.ForbiddenException('Accès non autorisé à ce ticket.');
        return ticket;
    }
    async updateStatus(id, nouveauStatut, modifieParId) {
        const ticket = await this.prisma.ticket.findUnique({ where: { id } });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket introuvable.');
        const updated = await this.prisma.$transaction(async (tx) => {
            const t = await tx.ticket.update({ where: { id }, data: { statut: nouveauStatut } });
            await tx.ticketHistorique.create({
                data: {
                    ticketId: id,
                    ancienStatut: ticket.statut,
                    nouveauStatut,
                    modifieParId,
                },
            });
            return t;
        });
        this.realtime.emitStatusChange(updated);
        return updated;
    }
    assignTechnician(id, technicienId) {
        return this.prisma.ticket.update({
            where: { id },
            data: { technicienId, statut: client_1.StatutTicket.assigne },
        });
    }
};
exports.TicketsService = TicketsService;
exports.TicketsService = TicketsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        realtime_gateway_1.RealtimeGateway])
], TicketsService);
//# sourceMappingURL=tickets.service.js.map