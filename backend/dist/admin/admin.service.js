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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
const sessions_service_1 = require("../realtime/sessions.service");
const client_1 = require("@prisma/client");
let AdminService = class AdminService {
    constructor(prisma, realtime, sessions) {
        this.prisma = prisma;
        this.realtime = realtime;
        this.sessions = sessions;
    }
    getLiveSessions() {
        return this.sessions.findAll();
    }
    async invalidateSession(socketId) {
        await this.realtime.invalidateSession(socketId);
        return { message: 'Session invalidée.' };
    }
    async statsOverview() {
        const [ticketsOuverts, ticketsTermines, techniciens] = await Promise.all([
            this.prisma.ticket.count({ where: { statut: { not: client_1.StatutTicket.termine } } }),
            this.prisma.ticket.count({ where: { statut: client_1.StatutTicket.termine } }),
            this.prisma.user.count({ where: { role: 'technicien' } }),
        ]);
        const revenu = await this.prisma.factureDevis.aggregate({
            where: { type: 'facture', statutPaiement: 'paye' },
            _sum: { montantTotal: true },
        });
        return {
            ticketsOuverts,
            ticketsTermines,
            techniciensActifs: techniciens,
            revenuTotal: revenu._sum.montantTotal ?? 0,
            enLigne: (await this.sessions.findAll()).length,
        };
    }
    async statsRepartition() {
        const groups = await this.prisma.ticket.groupBy({
            by: ['typeService'],
            _count: { typeService: true },
        });
        return groups.map((g) => ({ service: g.typeService, total: g._count.typeService }));
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        realtime_gateway_1.RealtimeGateway,
        sessions_service_1.SessionsService])
], AdminService);
//# sourceMappingURL=admin.service.js.map