import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { SessionsService } from '../realtime/sessions.service';
import { StatutTicket } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
    private sessions: SessionsService,
  ) {}

  getLiveSessions() {
    return this.sessions.findAll();
  }

  async invalidateSession(socketId: string) {
    await this.realtime.invalidateSession(socketId);
    return { message: 'Session invalidée.' };
  }

  async statsOverview() {
    const [ticketsOuverts, ticketsTermines, techniciens] = await Promise.all([
      this.prisma.ticket.count({ where: { statut: { not: StatutTicket.termine } } }),
      this.prisma.ticket.count({ where: { statut: StatutTicket.termine } }),
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
}
