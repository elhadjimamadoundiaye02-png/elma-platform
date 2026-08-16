export declare class CatalogService {
    findAll(): {
        id: string;
        nom: string;
        description: string;
        prixMin: number;
        prixMax: number;
    }[];
    estimate(serviceId: string): {
        service: string;
        fourchette: string;
        note: string;
    };
}
