import { PrismaService } from '../prisma/prisma.service';
import { CreateFactureDto } from './dto/create-facture.dto';
import { Role } from '../common/enums/role.enum';
export declare class FacturesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateFactureDto): Promise<any>;
    findForUser(userId: string, role: Role): Promise<any>;
    private findWithAccessCheck;
    generatePdf(id: string, userId: string, role: Role): Promise<{
        buffer: Buffer;
        filename: string;
    }>;
}
