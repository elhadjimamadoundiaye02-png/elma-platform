import { Injectable, NotFoundException } from '@nestjs/common';
import { SERVICES } from './catalog.data';

@Injectable()
export class CatalogService {
  findAll() {
    return SERVICES;
  }

  estimate(serviceId: string) {
    const service = SERVICES.find((s) => s.id === serviceId);
    if (!service) throw new NotFoundException('Service inconnu.');
    return {
      service: service.nom,
      fourchette: `${service.prixMin.toLocaleString('fr-FR')} – ${service.prixMax.toLocaleString('fr-FR')} FCFA`,
      note: 'Estimation indicative. Le devis précis est confirmé après diagnostic.',
    };
  }
}
