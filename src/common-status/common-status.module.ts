// src/common-status/common-status.module.ts
import { Module } from '@nestjs/common';
import { CommonStatusController } from './common-status.controller';
import { CommonStatusService } from './common-status.service';
import { PrismaModule } from '../prisma/prisma.module'; // needed for PrismaService

@Module({
  imports: [PrismaModule],
  controllers: [CommonStatusController],
  providers: [CommonStatusService],
})
export class CommonStatusModule {}
