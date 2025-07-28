
import { Module } from '@nestjs/common';
import { FilterSetService } from './filter-sets.service';
import { FilterSetController } from './filter-sets.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [FilterSetController],
  providers: [FilterSetService, PrismaService]
})
export class FilterSetsModule {}
