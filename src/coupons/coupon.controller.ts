import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import { CouponService } from "./coupon.service";
import { CreateCouponDto } from "./dto/create-coupon.dto";
import { UpdateCouponDto } from "./dto/update-coupon.dto";
import { AuthGuard } from "../auth/auth.guard";

@Controller("coupons")
export class CouponController {
  constructor(private readonly service: CouponService) {}

  @Post()
  create(@Body() dto: CreateCouponDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  // Specific routes FIRST
  @Get("code/:code")
  getByCode(@Param("code") code: string) {
    return this.service.findByCode(code);
  }

  @Get(":id(\\d+)")
  findOne(@Param("id") id: string) {
    return this.service.findOne(+id);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateCouponDto) {
    return this.service.update(+id, dto);
  }
  @UseGuards(AuthGuard)
  @Post("apply")
  applyCoupon(@Req() req, @Body() body: { code: string }) {
    return this.service.applyCouponToCart(req.user.id, body.code);
  }

 @UseGuards(AuthGuard)
@Post('apply-buy-now')
applyCouponBuyNow(
  @Req() req,
  @Body() body: { code: string }
) {
return this.service.applyCouponForItem(req.user.id, body.code);
}
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.remove(+id);
  }
}
