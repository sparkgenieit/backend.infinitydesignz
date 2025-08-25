import { Controller, Get, Query } from '@nestjs/common';
import { FiltersService } from './filters.service';
import { GetFacetsDto } from './dto/get-facets.dto';

@Controller('filters')
export class FiltersController {
  constructor(private readonly filtersService: FiltersService) {}

  // GET /filters?categoryId=&brandId=&q=&minPrice=&maxPrice=&showEmpty=
  @Get()
  getFacets(@Query() dto: GetFacetsDto) {
    return this.filtersService.getFacets(dto);
  }
}
