import { Module } from '@nestjs/common';
import { PriceRangeService } from './price-range.service';
import { PriceRangeController } from './price-range.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PriceRangeController],
  providers: [PriceRangeService],
})
export class PriceRangeModule {}