import { Controller, Get, Post, Body } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('services')
export class CatalogController {
  constructor(private catalogService: CatalogService) {}

  @Get()
  findAll() {
    return this.catalogService.findAll();
  }

  @Post('estimation')
  estimate(@Body('serviceId') serviceId: string) {
    return this.catalogService.estimate(serviceId);
  }
}
