import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
@Module({
  controllers: [CartController],
  providers: [CartService, PrismaService],
    imports: [PrismaModule, AuthModule],
  
})
export class CartModule {}