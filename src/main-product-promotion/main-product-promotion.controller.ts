// REPLACE (new file)
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { MainProductPromotionService } from './main-product-promotion.service';
import { CreateMainProductPromotionDto } from './dto/create-main-product-promotion.dto';
import { UpdateMainProductPromotionDto } from './dto/update-main-product-promotion.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('main-product-promotions')
export class MainProductPromotionController {
  constructor(private readonly service: MainProductPromotionService) {}

  @Post()
  create(@Body() dto: CreateMainProductPromotionDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: 'all' | 'active' | 'inactive',
    @Query('q') q?: string,
  ) {
    return this.service.findAll({ page, limit, status: status ?? 'all', q });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMainProductPromotionDto,
  ) {
    return this.service.update(id, dto);
  }

  // Soft delete (status=false)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
