import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { VariantsService } from './variants.service';
import { CreateVariantsDto, UpdateVariantsDto } from './dto';

@Controller('variants')
export class VariantsController {
  constructor(private readonly VariantsService: VariantsService) {}

  @Post()
  create(@Body() dto: CreateVariantsDto) {
    return this.VariantsService.create(dto);
  }

  @Get()
  findAll() {
    return this.VariantsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.VariantsService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVariantsDto) {
    return this.VariantsService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.VariantsService.remove(+id);
  }
}