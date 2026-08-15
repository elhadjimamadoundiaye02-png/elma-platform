import { Controller, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('sessions')
  getSessions() {
    return this.adminService.getLiveSessions();
  }

  @Delete('sessions/:socketId')
  invalidate(@Param('socketId') socketId: string) {
    return this.adminService.invalidateSession(socketId);
  }

  @Get('stats/overview')
  statsOverview() {
    return this.adminService.statsOverview();
  }

  @Get('stats/repartition')
  statsRepartition() {
    return this.adminService.statsRepartition();
  }
}
