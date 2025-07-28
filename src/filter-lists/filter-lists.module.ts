
import { Module } from '@nestjs/common';
import { FilterListService } from './filter-lists.service';
import { FilterListController } from './filter-lists.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [FilterListController],
  providers: [FilterListService, PrismaService]
})
export class FilterListsModule {}
