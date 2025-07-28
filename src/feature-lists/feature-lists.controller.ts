
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FeatureListService } from './feature-lists.service';

@Controller('feature-lists')
export class FeatureListController {
  constructor(private readonly service: FeatureListService) {}

  @Post()
  create(@Body() body: { label: string; priority: number; status?: boolean; featureSetId: number }) {
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
  update(@Param('id') id: string, @Body() body: { label?: string; priority?: number; status?: boolean; featureSetId?: number }) {
    return this.service.update(+id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
