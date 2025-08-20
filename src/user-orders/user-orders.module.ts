import { Module } from '@nestjs/common';
import { UserOrdersService } from './user-orders.service';
import { UserOrdersController } from './user-orders.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [UserOrdersController],
  providers: [UserOrdersService, PrismaService],
  exports: [UserOrdersService],
})
export class UserOrdersModule {}
