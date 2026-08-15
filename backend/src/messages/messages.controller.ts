import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('tickets/:ticketId/messages')
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get()
  findAll(@Param('ticketId') ticketId: string, @CurrentUser() user) {
    return this.messagesService.findByTicket(ticketId, user.userId, user.role);
  }

  // Limité à 30 messages / minute par utilisateur pour éviter le spam de la messagerie
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post()
  create(
    @Param('ticketId') ticketId: string,
    @Body() dto: CreateMessageDto,
    @CurrentUser() user,
  ) {
    return this.messagesService.create(ticketId, user.userId, user.role, dto.contenu);
  }
}
