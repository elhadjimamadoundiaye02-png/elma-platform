import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
  ) {}

  // Un ticket n'a que trois participants légitimes : le client, le technicien
  // assigné, et l'équipe admin (supervision/support). Toute autre personne
  // authentifiée reçoit un 403, même si elle possède un JWT valide.
  private async assertParticipant(ticketId: string, userId: string, role: Role) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket introuvable.');

    const estParticipant =
      role === Role.ADMIN || ticket.clientId === userId || ticket.technicienId === userId;
    if (!estParticipant) {
      throw new ForbiddenException("Vous n'êtes pas rattaché à ce ticket.");
    }
    return ticket;
  }

  async findByTicket(ticketId: string, userId: string, role: Role) {
    await this.assertParticipant(ticketId, userId, role);
    return this.prisma.message.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
      include: { auteur: { select: { id: true, nom: true, prenom: true, role: true } } },
    });
  }

  async create(ticketId: string, auteurId: string, role: Role, contenu: string) {
    await this.assertParticipant(ticketId, auteurId, role);

    const message = await this.prisma.message.create({
      data: { ticketId, auteurId, contenu },
      include: { auteur: { select: { id: true, nom: true, prenom: true, role: true } } },
    });

    // Diffusion immédiate aux participants connectés à la room `ticket:{id}`
    // (le client et le technicien rejoignent cette room via l'event `ticket:join`,
    // cf. realtime.gateway.ts). Un message envoyé pendant que le destinataire est
    // hors ligne reste consultable via GET /tickets/:id/messages à la reconnexion.
    this.realtime.emitNewMessage(ticketId, message);

    return message;
  }
}
