import { Module } from '@nestjs/common';
import { UserSubscribeService } from './user-subscribe.service';
import { UserSubscribeController } from './user-subscribe.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [UserSubscribeController],
  providers: [UserSubscribeService, PrismaService],
  exports: [UserSubscribeService],
})
export class UserSubscribeModule {}
