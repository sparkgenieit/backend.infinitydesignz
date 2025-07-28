import { Module } from '@nestjs/common';
import { FeatureTypesService } from './feature-types.service';
import { FeatureTypesController } from './feature-types.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [FeatureTypesService],
  controllers: [FeatureTypesController],
})
export class FeatureTypesModule {}