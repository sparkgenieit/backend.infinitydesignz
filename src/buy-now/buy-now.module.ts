import { Module } from "@nestjs/common";
import { BuyNowController } from "./buy-now.controller";
import { BuyNowService } from "./buy-now.service";
import { PrismaService } from "../prisma/prisma.service";
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
@Module({
  controllers: [BuyNowController],
  providers: [BuyNowService, PrismaService],
  exports: [BuyNowService],
      imports: [PrismaModule, AuthModule],
})
export class BuyNowModule {}
