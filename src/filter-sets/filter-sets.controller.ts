
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FilterSetService } from './filter-sets.service';

@Controller('filter-sets')
export class FilterSetController {
  constructor(private readonly service: FilterSetService) {}

  @Post()
  create(@Body() body: { title: string; priority: number; status?: boolean; filterTypeId: number }) {
    return this.service.create(body);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { title?: string; priority?: number; status?: boolean; filterTypeId?: number }) {
    return this.service.update(+id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
