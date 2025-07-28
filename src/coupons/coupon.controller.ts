import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common'
import { CouponService } from './coupon.service'
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
@Controller('coupons')
export class CouponController {
  constructor(private readonly service: CouponService) {}

  @Post()
  create(@Body() dto: CreateCouponDto) {
    return this.service.create(dto)
  }

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.service.update(+id, dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id)
  }
}