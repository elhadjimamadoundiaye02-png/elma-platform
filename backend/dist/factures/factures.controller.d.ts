import type { Response } from 'express';
import { FacturesService } from './factures.service';
import { CreateFactureDto } from './dto/create-facture.dto';
export declare class FacturesController {
    private facturesService;
    constructor(facturesService: FacturesService);
    findAll(user: any): Promise<any>;
    downloadPdf(id: string, user: any, res: Response): Promise<void>;
    create(dto: CreateFactureDto): Promise<any>;
}
