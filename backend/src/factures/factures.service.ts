import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFactureDto } from './dto/create-facture.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class FacturesService {
  constructor(private prisma: PrismaService) {}

  // Le PDF n'est pas stocké dans un bucket (pas de S3/MinIO en place) : il est
  // généré à la volée à chaque téléchargement à partir des données en base.
  // C'est un choix pragmatique tant que le stockage fichiers n'est pas branché —
  // ça évite une dépendance externe pour un document entièrement recalculable.
  async create(dto: CreateFactureDto) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: dto.ticketId },
      include: { client: true },
    });
    if (!ticket) throw new NotFoundException('Ticket introuvable.');

    return this.prisma.factureDevis.create({
      data: {
        ticketId: dto.ticketId,
        type: dto.type,
        montantTotal: dto.montantTotal,
        statutPaiement: dto.statutPaiement || 'en_attente',
      },
    });
  }

  async findForUser(userId: string, role: Role) {
    if (role === Role.ADMIN) {
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

  private async findWithAccessCheck(id: string, userId: string, role: Role) {
    const facture = await this.prisma.factureDevis.findUnique({
      where: { id },
      include: { ticket: { include: { client: true } } },
    });
    if (!facture) throw new NotFoundException('Facture introuvable.');
    if (role !== Role.ADMIN && facture.ticket.clientId !== userId) {
      throw new ForbiddenException("Vous n'avez pas accès à ce document.");
    }
    return facture;
  }

  async generatePdf(id: string, userId: string, role: Role): Promise<{ buffer: Buffer; filename: string }> {
    const facture = await this.findWithAccessCheck(id, userId, role);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
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

    doc.fontSize(14).fillColor('#0A1628').text(
      `Montant total : ${Number(facture.montantTotal).toLocaleString('fr-FR')} FCFA`,
    );
    doc.fontSize(10).fillColor('#6B7A90').text(`Statut du paiement : ${facture.statutPaiement}`);

    doc.moveDown(2);
    doc.fontSize(8).fillColor('#999').text('ELMA & Frères — +221 78 310 46 84 — elmaamadou02@gmail.com', { align: 'center' });

    doc.end();

    const buffer: Buffer = await new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    return { buffer, filename: `${facture.type}-${facture.ticket.reference}.pdf` };
  }
}
