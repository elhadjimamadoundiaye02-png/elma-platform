import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AssignTechnicianDto } from './dto/assign-technician.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Post()
  create(@CurrentUser() user, @Body() dto: CreateTicketDto) {
    return this.ticketsService.create(user.userId, dto);
  }

  @Get()
  findAll(@CurrentUser() user) {
    return this.ticketsService.findForUser(user.userId, user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user) {
    return this.ticketsService.findOne(id, user.userId, user.role);
  }

  @Roles(Role.ADMIN, Role.TECHNICIEN)
  @Patch(':id/statut')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto, @CurrentUser() user) {
    return this.ticketsService.updateStatus(id, dto.statut, user.userId);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/assigner')
  assign(@Param('id') id: string, @Body() dto: AssignTechnicianDto) {
    return this.ticketsService.assignTechnician(id, dto.technicienId);
  }
}
