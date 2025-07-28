
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FilterListService } from './filter-lists.service';

@Controller('filter-lists')
export class FilterListController {
  constructor(private readonly service: FilterListService) {}

  @Post()
  create(@Body() body: { label: string; priority: number; status?: boolean; filterSetId: number }) {
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
  update(@Param('id') id: string, @Body() body: { label?: string; priority?: number; status?: boolean; filterSetId?: number }) {
    return this.service.update(+id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
