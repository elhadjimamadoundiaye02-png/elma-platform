import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
export declare class MessagesController {
    private messagesService;
    constructor(messagesService: MessagesService);
    findAll(ticketId: string, user: any): Promise<any>;
    create(ticketId: string, dto: CreateMessageDto, user: any): Promise<any>;
}
