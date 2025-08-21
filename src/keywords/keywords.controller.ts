import {
  Body,
  Controller,
  Post,
  UseGuards,
  Headers,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { KeywordsService } from './keywords.service';
import { CreateKeywordDto } from './dto/create-keyword.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('keywords')
export class KeywordsController {
  constructor(
    private readonly service: KeywordsService,
    private readonly jwt: JwtService,
  ) {}

  private extractBearer(auth?: string): string {
    if (!auth || typeof auth !== 'string') return '';
    return auth.toLowerCase().startsWith('bearer ')
      ? auth.slice(7).trim()
      : '';
    }

  private userIdFromAuthHeader(auth?: string): number {
    const token = this.extractBearer(auth);
    if (!token) throw new UnauthorizedException('Missing Bearer token');

    let payload: any;
    try {
      // Uses secret configured in JwtModule.register(...)
      payload = this.jwt.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    const id = payload?.id ?? payload?.sub ?? payload?.userId;
    const n = Number(id);
    if (!id || Number.isNaN(n)) {
      throw new BadRequestException('User ID is missing or invalid in token payload');
    }
    return n;
  }

  @UseGuards(AuthGuard)
  @Post()
  async create(
    @Headers('authorization') auth: string,
    @Body() dto: CreateKeywordDto,
  ) {
    const userId = this.userIdFromAuthHeader(auth);
    return this.service.create(userId, dto.keyword.trim());
  }
}
