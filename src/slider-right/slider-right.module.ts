import { Module } from '@nestjs/common';
import { SliderRightService } from './slider-right.service';
import { SliderRightController } from './slider-right.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [SliderRightController],
  providers: [SliderRightService, PrismaService],
})
export class SliderRightModule {}