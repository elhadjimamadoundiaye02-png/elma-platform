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
exports.FacturesService = void 0;
const common_1 = require("@nestjs/common");
const pdfkit_1 = require("pdfkit");
const prisma_service_1 = require("../prisma/prisma.service");
const role_enum_1 = require("../common/enums/role.enum");
let FacturesService = class FacturesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const ticket = await this.prisma.ticket.findUnique({
            where: { id: dto.ticketId },
            include: { client: true },
        });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket introuvable.');
        return this.prisma.factureDevis.create({
            data: {
                ticketId: dto.ticketId,
                type: dto.type,
                montantTotal: dto.montantTotal,
                statutPaiement: dto.statutPaiement || 'en_attente',
            },
        });
    }
    async findForUser(userId, role) {
        if (role === role_enum_1.Role.ADMIN) {
            return this.prisma.factureDevis.findMany({
                include: { ticket: { include: { client: true } } },
                orderBy: { createdAt: 'desc' },
            });
        }
        return this.prisma.factureDevis.findMany({
            where: { ticket: { clientId: userId } },
            include: { ticket: { include: { client: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findWithAccessCheck(id, userId, role) {
        const facture = await this.prisma.factureDevis.findUnique({
            where: { id },
            include: { ticket: { include: { client: true } } },
        });
        if (!facture)
            throw new common_1.NotFoundException('Facture introuvable.');
        if (role !== role_enum_1.Role.ADMIN && facture.ticket.clientId !== userId) {
            throw new common_1.ForbiddenException("Vous n'avez pas accès à ce document.");
        }
        return facture;
    }
    async generatePdf(id, userId, role) {
        const facture = await this.findWithAccessCheck(id, userId, role);
        const doc = new pdfkit_1.default({ size: 'A4', margin: 50 });
        const chunks = [];
        doc.on('data', (c) => chunks.push(c));
        const label = facture.type === 'devis' ? 'DEVIS' : 'FACTURE';
        doc.fontSize(20).fillColor('#0A1628').text('ELMA & Frères', { continued: false });
        doc.fontSize(10).fillColor('#6B7A90').text('Services numériques & informatiques — Dakar');
        doc.moveDown(1.5);
        doc.fontSize(16).fillColor('#0A1628').text(`${label} — ${facture.ticket.reference}`);
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#333').text(`Date : ${facture.createdAt.toLocaleDateString('fr-FR')}`);
        doc.text(`Client : ${facture.ticket.client.prenom} ${facture.ticket.client.nom}`);
        doc.text(`Service : ${facture.ticket.typeService}`);
        doc.text(`Mode d'intervention : ${facture.ticket.modeIntervention}`);
        doc.moveDown(1);
        doc.fontSize(12).fillColor('#0A1628').text('Description de l\'intervention', { underline: true });
        doc.fontSize(10).fillColor('#333').text(facture.ticket.description);
        doc.moveDown(1.5);
        doc.fontSize(14).fillColor('#0A1628').text(`Montant total : ${Number(facture.montantTotal).toLocaleString('fr-FR')} FCFA`);
        doc.fontSize(10).fillColor('#6B7A90').text(`Statut du paiement : ${facture.statutPaiement}`);
        doc.moveDown(2);
        doc.fontSize(8).fillColor('#999').text('ELMA & Frères — +221 78 310 46 84 — elmaamadou02@gmail.com', { align: 'center' });
        doc.end();
        const buffer = await new Promise((resolve) => {
            doc.on('end', () => resolve(Buffer.concat(chunks)));
        });
        return { buffer, filename: `${facture.type}-${facture.ticket.reference}.pdf` };
    }
};
exports.FacturesService = FacturesService;
exports.FacturesService = FacturesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FacturesService);
//# sourceMappingURL=factures.service.js.map