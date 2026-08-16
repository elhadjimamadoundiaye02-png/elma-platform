import { UsersService } from './users.service';
import { Role } from '../common/enums/role.enum';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    findAll(): any;
    updateRole(id: string, role: Role): any;
}
