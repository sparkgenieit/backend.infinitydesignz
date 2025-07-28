import { Module } from '@nestjs/common';
import { FilterTypesService } from './filter-types.service';
import { FilterTypesController } from './filter-types.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [FilterTypesService],
  controllers: [FilterTypesController],
})
export class FilterTypesModule {}