import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { UserSubscribeService } from './user-subscribe.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { CreateUserSubscribeDto } from './dto/create-user-subscribe.dto';
import { UpdateUserSubscribeDto } from './dto/update-user-subscribe.dto';

@Controller('user-subscribe')
@UseGuards(JwtAuthGuard)
export class UserSubscribeController {
  constructor(private readonly service: UserSubscribeService) {}

  // CREATE
  @Post()
  create(@Body() dto: CreateUserSubscribeDto) {
    return this.service.create(dto);
  }

  // LIST (search/page/take)
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('page') pageRaw?: string,
    @Query('take') takeRaw?: string,
  ) {
    const page = pageRaw ? Number(pageRaw) : undefined;
    const take = takeRaw ? Number(takeRaw) : undefined;
    return this.service.findAll({ search, page, take });
  }

  // GET BY ID
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  // UPDATE BY ID
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserSubscribeDto) {
    return this.service.update(id, dto);
  }

  /**
   * DELETE BY EMAIL (from request body, not ID)
   * Usage: DELETE /user-subscribe
   * Payload: { "email": "user@example.com" }
   */
  @Delete()
  removeByEmail(@Body('email') email?: string) {
    if (!email || !email.trim()) {
      throw new BadRequestException('Body param "email" is required');
    }
    return this.service.removeByEmail(email.trim());
  }
}
