import { Controller, Get, Post, Param, Body, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { FacturesService } from './factures.service';
import { CreateFactureDto } from './dto/create-facture.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('factures')
export class FacturesController {
  constructor(private facturesService: FacturesService) {}

  @Get()
  findAll(@CurrentUser() user) {
    return this.facturesService.findForUser(user.userId, user.role);
  }

  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string, @CurrentUser() user, @Res() res: Response) {
    const { buffer, filename } = await this.facturesService.generatePdf(id, user.userId, user.role);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateFactureDto) {
    return this.facturesService.create(dto);
  }
}
