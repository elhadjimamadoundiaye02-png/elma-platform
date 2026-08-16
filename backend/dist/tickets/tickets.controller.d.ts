import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AssignTechnicianDto } from './dto/assign-technician.dto';
export declare class TicketsController {
    private ticketsService;
    constructor(ticketsService: TicketsService);
    create(user: any, dto: CreateTicketDto): Promise<any>;
    findAll(user: any): any;
    findOne(id: string, user: any): Promise<any>;
    updateStatus(id: string, dto: UpdateStatusDto, user: any): Promise<any>;
    assign(id: string, dto: AssignTechnicianDto): any;
}
