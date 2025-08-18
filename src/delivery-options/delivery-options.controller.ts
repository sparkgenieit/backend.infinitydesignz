import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  NotFoundException,
  ParseIntPipe,
} from '@nestjs/common';
import { DeliveryOptionsService } from './delivery-options.service';
import { CreateDeliveryOptionDto } from './dto/create-delivery-option.dto';
import { UpdateDeliveryOptionDto } from './dto/update-delivery-option.dto';

@Controller('delivery-options')
export class DeliveryOptionsController {
  constructor(private readonly deliveryOptionsService: DeliveryOptionsService) {}

  @Get()
  async findAll() {
    return this.deliveryOptionsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const option = await this.deliveryOptionsService.findOne(id);
    if (!option) throw new NotFoundException('Delivery option not found');
    return option;
  }

  @Post()
  async create(@Body() dto: CreateDeliveryOptionDto) {
    return this.deliveryOptionsService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDeliveryOptionDto) {
    return this.deliveryOptionsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.deliveryOptionsService.remove(id);
  }
}