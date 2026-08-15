import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { Role } from '../common/enums/role.enum';
import { StatutTicket } from '@prisma/client';

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
  ) {}

  private generateReference() {
    const n = Math.floor(1000 + Math.random() * 9000);
    return `ELMA-${new Date().getFullYear()}${n}`;
  }

  async create(clientId: string, dto: CreateTicketDto) {
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
        // Le QR code (pour les dépôts en atelier) encode la référence du ticket ;
        // il est généré et stocké dans MinIO par le storage module (non détaillé ici).
        qrCodeUrl: dto.modeIntervention === 'atelier' ? `qrcodes/pending-${clientId}` : null,
      },
    });

    // Notifie en direct le dashboard admin (room "admin", cf. realtime.gateway.ts)
    this.realtime.emitNewTicket(ticket);

    return ticket;
  }

  findForUser(userId: string, role: Role) {
    if (role === Role.ADMIN) {
      return this.prisma.ticket.findMany({ orderBy: { createdAt: 'desc' } });
    }
    if (role === Role.TECHNICIEN) {
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

  async findOne(id: string, userId: string, role: Role) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket introuvable.');

    const estAutorise =
      role === Role.ADMIN || ticket.clientId === userId || ticket.technicienId === userId;
    if (!estAutorise) throw new ForbiddenException('Accès non autorisé à ce ticket.');

    return ticket;
  }

  async updateStatus(id: string, nouveauStatut: StatutTicket, modifieParId: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket introuvable.');

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

    // Diffuse le changement au client + technicien concernés (déclenche aussi
    // la notification email/SMS/WhatsApp asynchrone via la queue BullMQ)
    this.realtime.emitStatusChange(updated);

    return updated;
  }

  assignTechnician(id: string, technicienId: string) {
    return this.prisma.ticket.update({
      where: { id },
      data: { technicienId, statut: StatutTicket.assigne },
    });
  }
}
