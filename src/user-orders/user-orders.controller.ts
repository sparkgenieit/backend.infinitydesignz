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
} from '@nestjs/common';
import { UserOrdersService } from './user-orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { CreateUserOrderDto } from './dto/create-user-order.dto';
import { UpdateUserOrderDto } from './dto/update-user-order.dto';

@Controller('user-orders')
@UseGuards(JwtAuthGuard)
export class UserOrdersController {
  constructor(private readonly service: UserOrdersService) {}

  // CREATE
  @Post()
  create(@Body() dto: CreateUserOrderDto) {
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

  // UPDATE
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserOrderDto) {
    return this.service.update(id, dto);
  }

  // DELETE
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
