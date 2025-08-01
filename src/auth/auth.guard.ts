import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  BadRequestException
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    
    private readonly usersService: UsersService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const auth = req.headers.authorization?.split(' ') ?? [];

    if (auth[0] !== 'Bearer' || !auth[1]) {
      throw new UnauthorizedException('Missing or invalid token');
    }

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(auth[1], {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Token verification failed');
    }
if (!payload.id) {
      throw new BadRequestException('User ID is missing in token payload');
    }
    const user = await this.usersService.getUserById(payload.id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    req['user'] = user;
    return true;
  }
}
