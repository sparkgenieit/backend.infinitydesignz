
import { Module } from '@nestjs/common';
import { FeatureListService } from './feature-lists.service';
import { FeatureListController } from './feature-lists.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [FeatureListController],
  providers: [FeatureListService, PrismaService]
})
export class FeatureListsModule {}
