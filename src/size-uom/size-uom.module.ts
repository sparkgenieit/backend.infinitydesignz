import { Module } from '@nestjs/common';
import { SizeUOMService } from './size-uom.service';
import { SizeUOMController } from './size-uom.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SizeUOMService],
  controllers: [SizeUOMController],
})
export class SizeUOMModule {}