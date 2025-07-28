import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BrandsService } from './brands.service';
import { parseBooleanStatus } from '../utils/validate-status'; // adjust path

@Controller('brands')
export class BrandsController {
  constructor(private readonly service: BrandsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: { name: string; logo_url?: string; status?: boolean }) {
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
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
     dto.status = parseBooleanStatus(dto.status); //  sanitize
    return this.service.update(+id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
