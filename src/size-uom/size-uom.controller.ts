import {
  Controller, Get, Post, Body, Param, Patch, Delete, UseGuards
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SizeUOMService } from './size-uom.service';
import { parseBooleanStatus } from '../utils/validate-status'; // adjust path

@Controller('size-uom')
export class SizeUOMController {
  constructor(private readonly service:SizeUOMService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: any) {
     dto.status = parseBooleanStatus(dto.status); //  sanitize
    return this.service.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id') // 
  update(@Param('id') id: string, @Body() dto: any) {
    dto.status = parseBooleanStatus(dto.status);
    return this.service.update(+id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}