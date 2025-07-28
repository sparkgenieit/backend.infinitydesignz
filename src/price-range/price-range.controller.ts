import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { PriceRangeService } from './price-range.service';
import { CreatePriceRangeDto } from './dto/create-price-range.dto';
import { UpdatePriceRangeDto } from './dto/update-price-range.dto';

@Controller('price-ranges')
export class PriceRangeController {
  constructor(private readonly service: PriceRangeService) {}

  @Post()
  create(@Body() dto: CreatePriceRangeDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePriceRangeDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}