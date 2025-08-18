import { Module } from '@nestjs/common';
import { DeliveryOptionsService } from './delivery-options.service';
import { DeliveryOptionsController } from './delivery-options.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [DeliveryOptionsController],
  providers: [DeliveryOptionsService, PrismaService],
})
export class DeliveryOptionsModule {}
