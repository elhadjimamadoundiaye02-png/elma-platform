import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums/role.enum';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): any;
    findById(id: string): Promise<any>;
    updateRole(id: string, role: Role): any;
}
