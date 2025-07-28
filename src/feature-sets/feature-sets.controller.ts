
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FeatureSetService } from './feature-sets.service';

@Controller('feature-sets')
export class FeatureSetController {
  constructor(private readonly service: FeatureSetService) {}

  @Post()
  create(@Body() body: { title: string; priority: number; status?: boolean; featureTypeId: number }) {
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
  update(@Param('id') id: string, @Body() body: { title?: string; priority?: number; status?: boolean; featureTypeId?: number }) {
    return this.service.update(+id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
