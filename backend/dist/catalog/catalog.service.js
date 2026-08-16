"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogService = void 0;
const common_1 = require("@nestjs/common");
const catalog_data_1 = require("./catalog.data");
let CatalogService = class CatalogService {
    findAll() {
        return catalog_data_1.SERVICES;
    }
    estimate(serviceId) {
        const service = catalog_data_1.SERVICES.find((s) => s.id === serviceId);
        if (!service)
            throw new common_1.NotFoundException('Service inconnu.');
        return {
            service: service.nom,
            fourchette: `${service.prixMin.toLocaleString('fr-FR')} – ${service.prixMax.toLocaleString('fr-FR')} FCFA`,
            note: 'Estimation indicative. Le devis précis est confirmé après diagnostic.',
        };
    }
};
exports.CatalogService = CatalogService;
exports.CatalogService = CatalogService = __decorate([
    (0, common_1.Injectable)()
], CatalogService);
//# sourceMappingURL=catalog.service.js.map