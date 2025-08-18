import { Module } from '@nestjs/common';
import { PincodeController } from './pincode.controller';
import { PincodeService } from './pincode.service';
import { PrismaService } from '../prisma/prisma.service'; // Adjust if your path differs

@Module({
  controllers: [PincodeController],
  providers: [PincodeService, PrismaService],
  exports: [PincodeService],
})
export class PincodeModule {}
