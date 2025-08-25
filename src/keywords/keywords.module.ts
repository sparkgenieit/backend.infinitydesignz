// src/keywords/keywords.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { KeywordsService } from './keywords.service';
import { KeywordsController } from './keywords.controller';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => AuthModule),
    // Optional if AuthModule already exports JwtService:
    JwtModule.register({}) // uses global config if set; or pass { secret: process.env.JWT_SECRET }
  ],
  controllers: [KeywordsController],
  providers: [KeywordsService],
  exports: [KeywordsService],
})
export class KeywordsModule {}
