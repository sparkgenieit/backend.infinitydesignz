
import { Module } from '@nestjs/common';
import { FeatureSetService } from './feature-sets.service';
import { FeatureSetController } from './feature-sets.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [FeatureSetController],
  providers: [FeatureSetService, PrismaService]
})
export class FeatureSetsModule {}
